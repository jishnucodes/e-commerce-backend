import { Decimal } from "@prisma/client/runtime/library";
import { db } from "../lib/prisma";

interface GetOrdersInput {
  skip: number;
  take: number;
  where: any;
  sortBy: string;
  order: "asc" | "desc";
}

enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

type OrderData = {
  id: number;
  userId: number;
  role: string;
  items: {
    productVariantId: number;
    quantity: number;
  }[];
  shippingAddressId: number;
  billingAddressId: number;
  shippingMethodId: number;
  discountCode?: string;
  isGift?: boolean;
  giftMessage?: string;
  notes?: string;
  orderStatus: OrderStatus;
  cancellationReason: string;
  trackingNumber: string;
  deliveryDate: string;
};

//create order
export const createOrder = async (data: OrderData) => {
  if (data.role !== "ADMIN") {
    throw new Error("User is not admin");
  }

  const dbUser = await db.user.findUnique({ where: { id: data.userId } });
  if (!dbUser) throw new Error("User not found");

  return await db.$transaction(async (tx) => {
    //Fetch product variant prices
    const variants = await tx.productVariant.findMany({
      where: {
        id: {
          in: data.items.map((item) => item.productVariantId),
        },
      },
    });

    if (variants.length !== data.items.length) {
      throw new Error("Some product variants not found");
    }

    //Calculate total price
    let subtotal = new Decimal(0);
    const orderItems = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.productVariantId);
      if (!variant) {
        throw new Error(
          `Product variant with id ${item.productVariantId} not found`
        );
      }
      const price = new Decimal(variant.price || 0);
      subtotal = subtotal.plus(price.mul(item.quantity));

      return {
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price,
        discountAmount: new Decimal(0), // apply coupon logic here
      };
    });

    const shippingCost = new Decimal(10); // example flat rate
    const taxAmount = subtotal.mul(0.1); // example 10%
    const totalAmount = subtotal.plus(shippingCost).plus(taxAmount);

    //Create Order with nested items
    const order = await tx.order.create({
      data: {
        userId: data.userId,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        shippingMethodId: data.shippingMethodId,
        discountCode: data.discountCode,
        isGift: data.isGift ?? false,
        giftMessage: data.giftMessage,
        notes: data.notes,
        totalAmount,
        shippingCost,
        taxAmount,
        //order items table
        orderItems: {
          create: orderItems,
        },
        //payment table
        payment: {
          create: {
            method: "stripe",
            status: "PENDING",
          },
        },
      },
      include: {
        orderItems: true,
        payment: true,
      },
    });

    return order;
  });
};

// GET /orders
export const getOrders = async ({
  skip,
  take,
  where,
  sortBy,
  order,
}: GetOrdersInput) => {
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: order },
      select: {
        id: true,
        userId: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        orderedDate: true,
        trackingNumber: true,
        deliveryDate: true,
        totalAmount: true,
        shippingCost: true,
        taxAmount: true,
        discountCode: true,
        cancellationReason: true,
        refundStatus: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, userName: true } },
        // ✅ Uncomment these when needed
        // brand: { select: { id: true, brandName: true } },
        // category: { select: { id: true, categoryName: true } },
        // images: {
        //   select: {
        //     id: true,
        //     altText: true,
        //     isMain: true,
        //     imageUrl: true,
        //   },
        //   take: 3,
        // },
      },
    }),
    db.order.count({ where }),
  ]);

  return { orders, total };
};

// GET /orders/:id
export const getOrderById = async (orderId: number) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      shippingAddress: true,
      billingAddress: true,
      shippingMethod: true,
      payment: true,
    },
  });
  return order;
};

// PATCH /orders/:id
export const updateOrder = async (data: OrderData) => {
  const { id, shippingAddressId, billingAddressId, notes } = data;

  const updatedOrder = await db.order.update({
    where: { id },
    data: { shippingAddressId, billingAddressId, notes },
  });

  return updatedOrder;
};

// PATCH /orders/:id/cancel
export const cancelOrder = async (data: OrderData) => {
  const { id, orderStatus, cancellationReason } = data;

  const order = await db.order.update({
    where: { id },
    data: {
      orderStatus: orderStatus || "CANCELLED",
      cancellationReason: cancellationReason || "User requested cancellation",
    },
  });

  return order;
};

// PATCH /orders/:id/status
export const updateOrderStatus = async (data: OrderData) => {
  const { id, orderStatus, trackingNumber, deliveryDate } = data;

  const updated = await db.order.update({
    where: { id },
    data: {
      orderStatus,
      trackingNumber,
      deliveryDate,
    },
  });

  return updated;
};

//Handle payment success (Stripe webhook)
export const handlePaymentSuccess = async (
  orderId: number,
  transactionId: string
) => {
  return await db.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
      },
    });

    await tx.payment.update({
      where: {
        orderId,
      },
      data: {
        status: "PAID",
        transactionId,
        paidAt: new Date(),
      },
    });

    await tx.invoice.create({
      data: {
        orderId,
        invoiceNo: `INV-${Date.now()}`,
      },
    });

    return order;
  });
};

//Handle Return Request (Customer request for return)
export const handleReturnRequest = async (orderId: number, reason: string) => {
  return await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error("Order not found");

    if (order.paymentStatus !== "PAID") {
      throw new Error("Only paid orders can be returned");
    }

    const returnRequest = await tx.return.create({
      data: {
        orderId,
        reason,
      },
    });

    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        refundStatus: "REQUESTED",
      },
    });

    return returnRequest;
  });
};

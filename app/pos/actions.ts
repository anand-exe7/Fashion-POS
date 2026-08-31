"use server";

import { requireStaff, requireAdmin, setSessionRoleCookie, clearSessionRoleCookie } from "@/lib/auth";
import * as db from "@/lib/db";
import type { StoredProduct, StoredOrder } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function verifyPasscode(
  enteredPasscode: string,
): Promise<{ success: boolean; role?: "staff" | "admin" }> {
  // Read from .env — no passcodes in source, and never sent to the browser.
  const adminPasscode = process.env.ADMIN_PASSCODE;
  const staffPasscode = process.env.STAFF_PASSCODE;

  const normalizedEntered = enteredPasscode.replace(/\s/g, "");

  if (!normalizedEntered) {
    return { success: false };
  }

  if (adminPasscode && normalizedEntered === adminPasscode) {
    await setSessionRoleCookie("admin");
    return { success: true, role: "admin" };
  }
  if (staffPasscode && normalizedEntered === staffPasscode) {
    await setSessionRoleCookie("staff");
    return { success: true, role: "staff" };
  }

  return { success: false };
}

export async function logoutAction() {
  await clearSessionRoleCookie();
}

export async function listProductsAction() {
  await requireStaff();
  return db.getProducts();
}

export async function listOrdersAction() {
  await requireStaff();
  return db.getOrders();
}

export async function orderExistsAction(id: string) {
  await requireStaff();
  return db.orderExists(id);
}

export async function createProductAction(input: Omit<StoredProduct, "id">) {
  await requireAdmin();
  return db.addProduct(input);
}

export async function updateProductAction(
  id: string,
  input: Omit<StoredProduct, "id">,
) {
  await requireAdmin();
  return db.updateProduct(id, input);
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  return db.deleteProduct(id);
}

export async function createOrderAction(order: StoredOrder) {
  await requireStaff();
  await db.saveOrder(order);
  revalidatePath(`/invoice/${order.id}`);
}

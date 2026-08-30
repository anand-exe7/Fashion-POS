"use server";

export async function verifyPasscode(enteredPasscode: string): Promise<{ success: boolean; role?: 'staff' | 'admin' }> {
  // Read from .env — no passcodes in source, and never sent to the browser.
  const adminPasscode = process.env.ADMIN_PASSCODE;
  const staffPasscode = process.env.STAFF_PASSCODE;

  const normalizedEntered = enteredPasscode.replace(/\s/g, "");

  if (!normalizedEntered) {
    return { success: false };
  }

  if (adminPasscode && normalizedEntered === adminPasscode) {
    return { success: true, role: 'admin' };
  }
  if (staffPasscode && normalizedEntered === staffPasscode) {
    return { success: true, role: 'staff' };
  }

  return { success: false };
}

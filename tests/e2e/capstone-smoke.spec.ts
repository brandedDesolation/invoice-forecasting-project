import { expect, test } from "@playwright/test";

test("capstone demo path loads core admin surfaces", async ({ page }) => {
  const loginResponse = await page.request.post("http://localhost:8000/api/v1/auth/login", {
    data: { email: "admin@invoiceforecast.com", password: "admin123" },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();

  await page.addInitScript((data) => {
    localStorage.setItem("invoice_forecast_token", data.access_token);
    localStorage.setItem("invoice_forecast_user", JSON.stringify(data.user));
  }, loginData);
  await page.goto("/admin/dashboard");

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  await expect(page.getByText(/purchase orders/i).first()).toBeVisible();

  await page.goto("/admin/invoices");
  await expect(page.getByRole("heading", { name: /invoice management/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /upload invoice/i })).toBeVisible();

  const firstInvoice = page.locator("tbody tr").first();
  if (await firstInvoice.count()) {
    await firstInvoice.getByRole("button", { name: /view/i }).first().click();
    await expect(page.getByRole("heading", { name: /invoice details/i })).toBeVisible();
    await expect(page.getByText(/audit trail/i)).toBeVisible();
  }

  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: /reports/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /download pdf/i }).first()).toBeVisible();

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: /user management/i })).toBeVisible();

  await page.goto("/admin/purchase-orders");
  await expect(page.getByRole("heading", { name: /purchase orders/i })).toBeVisible();

  await page.goto("/admin/expenses");
  await expect(page.getByRole("heading", { name: /expenses/i })).toBeVisible();

  await page.goto("/admin/ledger");
  await expect(page.getByRole("heading", { name: /general ledger/i })).toBeVisible();

  await page.goto("/admin/tasks");
  await expect(page.getByRole("heading", { name: /operations tasks/i })).toBeVisible();
});

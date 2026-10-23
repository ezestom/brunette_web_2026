import test from "node:test";
import assert from "node:assert/strict";
import { sendContactMessage } from "../src/lib/contact.ts";

const fields = {
  firstName: "Demo",
  lastName: "Prueba",
  phone: "",
  email: "demo@example.test",
  message: "Prueba automatizada",
};
test("contact can address an activated form ID without changing provider or confirming failures", async () => {
  const formId = "a".repeat(32);
  await sendContactMessage(
    fields,
    async (url) => {
      assert.equal(url, `https://formsubmit.co/ajax/${formId}`);
      return Response.json({ success: "true" });
    },
    "http://127.0.0.1:4322/",
    formId,
  );
});
test("the observed FormSubmit response preserves the pending activation state", async () => {
  await assert.rejects(
    sendContactMessage(fields, async () =>
      Response.json({
        success: "false",
        message:
          "This form needs Activation. We've sent you an email containing an 'Activate Form' link. Just click it and your form will be actived!",
      }),
    ),
    { name: "ContactActivationRequiredError" },
  );
});
test("activation responses report a pending setup instead of a delivery error", async () => {
  for (const success of [false, "false", true]) {
    await assert.rejects(
      sendContactMessage(fields, async () =>
        Response.json({
          success,
          message:
            "Please check your email for an activation link. This form needs Activation.",
        }),
      ),
      (error) =>
        error.name === "ContactActivationRequiredError" &&
        /activar/i.test(error.message),
    );
  }
});
test("contact sends the email payload and only accepts an explicit confirmation", async () => {
  await sendContactMessage(fields, async (url, options) => {
    assert.equal(new URL(url).hostname, "formsubmit.co");
    assert.equal(options.method, "POST");
    const body = JSON.parse(options.body);
    assert.equal(body.email, fields.email);
    assert.equal(body.message, fields.message);
    return Response.json({ success: "true", message: "Success" });
  });
});
test("contact explicitly identifies the activated site without depending on browser referrer headers", async () => {
  await sendContactMessage(
    fields,
    async (_url, options) => {
      assert.equal(JSON.parse(options.body)._url, "http://127.0.0.1:4322/");
      return Response.json({ success: "true" });
    },
    "http://127.0.0.1:4322/",
  );
});
test("contact rejects HTTP errors, unconfirmed 200 responses, malformed data and activation", async () => {
  for (const [body, status] of [
    [{ success: false }, 200],
    [{ success: true }, 500],
    [{ success: true, message: "Activation required" }, 200],
    [{}, 200],
  ]) {
    await assert.rejects(
      sendContactMessage(fields, async () => Response.json(body, { status })),
    );
  }
  await assert.rejects(
    sendContactMessage(fields, async () => new Response("invalid json")),
  );
  await assert.rejects(
    sendContactMessage(fields, async () => {
      throw new Error("Network error");
    }),
  );
});

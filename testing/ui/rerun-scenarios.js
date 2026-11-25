const {
  openBrowser,
  closeBrowser,
  goto,
  text,
  click,
  write,
  into,
  textBox,
  button,
  link,
  currentURL,
} = require("taiko");
const assert = require("assert");

async function scenario(name, fn) {
  await openBrowser({ headless: true, args: ["--window-size=1280,900"] });
  try {
    await fn();
    console.log("PASS " + name);
  } catch (error) {
    console.log("FAIL " + name + " :: " + error.message);
  } finally {
    try {
      await closeBrowser();
    } catch {
      /* browser already closed */
    }
  }
}

(async () => {
  await scenario("UI-01 sign-in page", async () => {
    await goto("http://127.0.0.1:3000/auth/signin");
    assert.ok(await text("Sign in").exists(8000, 400));
    assert.ok(await text("Continue").exists(3000, 200));
    assert.ok(await text("Create an account").exists(3000, 200));
  });

  await scenario("UI-02 empty sign-in stays", async () => {
    await goto("http://127.0.0.1:3000/auth/signin");
    await click(button("Continue"));
    const url = await currentURL();
    assert.ok(String(url).includes("/auth/signin"), String(url));
  });

  await scenario("UI-03 wrong password", async () => {
    await goto("http://127.0.0.1:3000/auth/signin");
    await write("st-student", into(textBox({ id: "username" })));
    await write("wrong-password", into(textBox({ id: "password" })));
    await click(button("Continue"));
    const shown = await text("Invalid username or password").exists(15000, 500);
    assert.ok(shown, "expected the invalid-credentials message");
  });

  await scenario("UI-04 password mismatch", async () => {
    await goto("http://127.0.0.1:3000/auth/register");
    assert.ok(await text("Create account").exists(8000, 400));
    await write("ststudent", into(textBox({ id: "username" })));
    await write("ststudent@university.edu", into(textBox({ id: "email" })));
    await write("secret-pass", into(textBox({ id: "password" })));
    await write("other-pass", into(textBox({ id: "confirmPassword" })));
    await click(button("Register"));
    assert.ok(await text("Passwords do not match").exists(5000, 300));
  });

  await scenario("UI-05 register links to sign-in", async () => {
    await goto("http://127.0.0.1:3000/auth/register");
    await click(link("Sign in"));
    assert.ok(await text("Access your library and study tools.").exists(8000, 400));
  });
})();

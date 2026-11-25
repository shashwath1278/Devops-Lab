const assert = require("assert");
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
  waitFor,
} = require("taiko");

const base = "http://127.0.0.1:3000";
const results = [];

async function scenario(name, fn) {
  await openBrowser({
    headless: true,
    args: ["--window-size=1280,900"],
  });
  try {
    await fn();
    results.push({ name, status: "PASS" });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, status: "FAIL", error: error.message });
    console.log(`FAIL  ${name}`);
    console.log(`      ${error.message}`);
  } finally {
    try {
      await closeBrowser();
    } catch {
      // The browser may already be closed after a navigation failure.
    }
  }
}

async function shows(content) {
  const visible = await text(content).exists(8000, 400);
  assert.ok(visible, `expected to see "${content}"`);
}

(async () => {
  await scenario("Sign-in page shows the study entry points", async () => {
    await goto(`${base}/auth/signin`);
    await shows("Sign in");
    await shows("Continue");
    await shows("Create an account");
  });

  await scenario("Empty sign-in stays on the page", async () => {
    await goto(`${base}/auth/signin`);
    await click(button("Continue"));
    const url = await currentURL();
    assert.ok(String(url).includes("/auth/signin"), `stayed on ${url}`);
  });

  await scenario("Wrong password is rejected", async () => {
    await goto(`${base}/auth/signin`);
    await write("st-student", into(textBox({ id: "username" })));
    await write("wrong-password", into(textBox({ id: "password" })));
    await click(button("Continue"));
    await waitFor(async () => text("Invalid username or password").exists(), 8000);
    await shows("Invalid username or password");
  });

  await scenario("Register page rejects mismatched passwords", async () => {
    await goto(`${base}/auth/register`);
    await shows("Create account");
    await write("ststudent", into(textBox({ id: "username" })));
    await write("ststudent@university.edu", into(textBox({ id: "email" })));
    await write("secret-pass", into(textBox({ id: "password" })));
    await write("other-pass", into(textBox({ id: "confirmPassword" })));
    await click(button("Register"));
    await shows("Passwords do not match");
  });

  await scenario("Register page links back to sign in", async () => {
    await goto(`${base}/auth/register`);
    await click(link("Sign in"));
    await shows("Access your library and study tools.");
  });

  const failed = results.filter((item) => item.status === "FAIL").length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();

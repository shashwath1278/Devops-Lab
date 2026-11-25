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
const assert = require("assert");

beforeScenario(async () => {
  await openBrowser({
    headless: true,
    args: ["--window-size=1280,900"],
  });
});

afterScenario(async () => {
  await closeBrowser();
});

step("Open the sign in page", async () => {
  await goto("http://127.0.0.1:3000/auth/signin", { waitForEvents: ["loadEventFired"] });
});

step("Open the register page", async () => {
  await goto("http://127.0.0.1:3000/auth/register", { waitForEvents: ["loadEventFired"] });
});

step("The page shows <content>", async (content) => {
  const visible = await text(content).exists(8000, 400);
  assert.ok(visible, `expected to see "${content}"`);
});

step("Submit the sign in form", async () => {
  await click(button("Continue"));
});

step("The address contains <part>", async (part) => {
  const url = await currentURL();
  assert.ok(String(url).includes(part), `expected ${url} to contain ${part}`);
});

step("Sign in as <username> with password <password>", async (username, password) => {
  await write(username, into(textBox({ id: "username" })));
  await write(password, into(textBox({ id: "password" })));
  await click(button("Continue"));
  await waitFor(2000);
});

step(
  "Register user <username> email <email> with password <password> and confirmation <confirmation>",
  async (username, email, password, confirmation) => {
    await write(username, into(textBox({ id: "username" })));
    await write(email, into(textBox({ id: "email" })));
    await write(password, into(textBox({ id: "password" })));
    await write(confirmation, into(textBox({ id: "confirmPassword" })));
    await click(button("Register"));
    await waitFor(500);
  },
);

step("Follow <label>", async (label) => {
  await click(link(label));
  await waitFor(500);
});

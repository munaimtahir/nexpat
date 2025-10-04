describe('ClinicQ App', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  it('shows the login screen', async () => {
    await expect(element(by.text('Welcome back'))).toBeVisible();
    await expect(element(by.text('Sign in'))).toBeVisible();
  });
});

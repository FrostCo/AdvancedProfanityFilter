import OptionPage from '@APF/OptionPage';

export default class OptionAuth {
  authenticated: boolean;
  optionPage: OptionPage;
  password: string;

  //#region Class reference helpers
  // Can be overridden in children classes
  static get OptionPage() {
    return OptionPage;
  }
  get Class() {
    return this.constructor as typeof OptionAuth;
  }
  //#endregion

  authenticate(evt) {
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    if (passwordInput.value == this.password) {
      this.authenticated = true;
      this.optionPage.closeModal('passwordModal');
      this.optionPage.show(document.getElementById('main'));
      this.optionPage.hideInputError(passwordInput);
    } else {
      this.optionPage.showInputError(passwordInput);
    }
  }

  constructor(optionPage: OptionPage, password?: string) {
    this.optionPage = optionPage;
    this.password = password;
    this.authenticated = false;
  }

  async setPassword() {
    const password = document.getElementById('setPassword') as HTMLInputElement;
    this.optionPage.cfg.password = password.value;
    try {
      await this.optionPage.cfg.save('password');
      password.value = '';
      this.setPasswordButton();
      if (this.optionPage.cfg.contextMenu) this.optionPage.sendUpdateContextMenuMessage();
    } catch (err) {
      this.optionPage.handleError(
        this.optionPage.translation.t('options:configsPage.messages.updatePasswordFailed'),
        err
      );
    }
  }

  setPasswordButton() {
    const passwordText = document.getElementById('setPassword') as HTMLInputElement;
    const passwordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;

    if (this.optionPage.cfg.password) {
      // Password already set
      this.optionPage.enableBtn(passwordBtn);
      if (passwordText.value) {
        // Password field filled
        passwordBtn.innerText = this.optionPage.translation.t('options:configsPage.buttons.setPassword').toUpperCase();
      } else {
        // Empty password field
        passwordBtn.innerText = this.optionPage.translation
          .t('options:configsPage.buttons.removePassword')
          .toUpperCase();
      }
    } else {
      // Password not already set
      passwordBtn.innerText = this.optionPage.translation.t('options:configsPage.buttons.setPassword').toUpperCase();
      if (passwordText.value) {
        // Password field filled
        this.optionPage.enableBtn(passwordBtn);
      } else {
        // Empty password field
        this.optionPage.disableBtn(passwordBtn);
      }
    }
  }
}

import OptionPage from '@APF/optionPage';

export default class OptionAuth {
  authenticated: boolean;
  optionPage: OptionPage;
  password: string;

  authenticate(evt) {
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    if (passwordInput.value == this.password) {
      this.authenticated = true;
      OptionPage.closeModal('passwordModal');
      OptionPage.show(document.getElementById('main'));
      OptionPage.hideInputError(passwordInput);
    } else {
      OptionPage.showInputError(passwordInput);
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
    } catch (err) {
      OptionPage.handleError('Failed to update password.', err);
    }
  }

  setPasswordButton() {
    const passwordText = document.getElementById('setPassword') as HTMLInputElement;
    const passwordBtn = document.getElementById('setPasswordBtn') as HTMLButtonElement;

    if (this.optionPage.cfg.password) { // Password already set
      OptionPage.enableBtn(passwordBtn);
      if (passwordText.value) { // Password field filled
        passwordBtn.innerText = 'SET';
      } else { // Empty password field
        passwordBtn.innerText = 'REMOVE';
      }
    } else { // Password not already set
      passwordBtn.innerText = 'SET';
      if (passwordText.value) { // Password field filled
        OptionPage.enableBtn(passwordBtn);
      } else { // Empty password field
        OptionPage.disableBtn(passwordBtn);
      }
    }
  }
}


# 🔒 SiteLock - Website Locker

**Stop unauthorized access to your important websites. Secure your online privacy with SiteLock.**

  

SiteLock is a security-focused Chrome extension designed to provide robust ***password, PIN, and passkey*** protection for your websites. Think of it as an "app lock" for the web, adding an essential layer of security to your sensitive online spaces. Whether it's your personal email, banking portal, social media, or any site containing private information, SiteLock ensures that **only you or authorized users can gain access**, even after browser restarts.

  

## 🚀 Features

-  **🔐 Robust Website Protection:** Lock down any website with your choice of **Password, PIN, or Passkey**. Secure your most sensitive web applications and personal sites with ease.

-  **🛠️ Smart & Efficient Session Management:** Authentication is intelligently managed; access persists only while relevant tabs are open. Once all tabs for a protected site are closed, access is **automatically revoked**, ensuring enhanced security by default.

-  **💡 Flexible Multi-Factor Authentication:** Choose the authentication method that suits you best. SiteLock supports **password-based, PIN-based, and passkey authentication** for maximum flexibility and security.

-  **📜 Convenient Context Menu Integration:** Quickly and easily manage your protected sites directly via the **right-click context menu**. Access preferences and secure new sites without interrupting your workflow.
- **🛡️ Origin-Based Security:** Protection is implemented at the **origin level**, preventing any bypasses through subdomains. Secure the entire domain and all its subdomains with a single rule.
- **⚙️ Customizable Settings:** Fine-tune your SiteLock experience with **adjustable settings**, including options for auto-confirmation and passkey login delays, ensuring a balance between security and convenience.
- **✨ User-Friendly Interface:** Enjoy a **clean and intuitive interface** designed for ease of use. Manage your protected sites and settings with a straightforward and user-friendly design.
  

## 📦 Installation

Get started with SiteLock in just a few easy steps:
1. **Clone or Download:**
	-   **Clone the repository:** If you are a developer or prefer to work with the source code:- 
	```Bash
	 git clone https://github.com/imshihab/sitelock.git
    ```

2. **Open Chrome Extensions Page:** Open Google Chrome and navigate to `chrome://extensions/` in the address bar.

3.   **Enable Developer Mode:** In the top right corner of the Extensions page, toggle the **"Developer mode" switch to the ON position**.
    
4.   **Load Unpacked Extension:** Click the **"Load unpacked"** button located at the top left of the Extensions page.
    
5.   **Select Extension Directory:** In the file dialog that appears, navigate to and select the **extension directory** where you cloned or extracted the SiteLock extension files. Click "Select Folder".
    
6.   **Configuration Page Opens:** Upon successful installation, SiteLock will automatically open its configuration page in a new tab, allowing you to immediately begin securing your websites.

  

## 🎯 Usage Guide
Protecting and accessing your websites with SiteLock is straightforward:
  

### 🔹 Securing a Website

1. **Visit the Target Website:** Navigate to the specific website you wish to protect using SiteLock.

2. **Click the SiteLock Icon:** Locate and click the SiteLock extension icon in your Chrome toolbar (usually located in the top right corner of your browser window).

3. **Choose Authentication Method:** You will be prompted to choose your preferred authentication method for this website:
	-   **Password:** Set a strong password for robust protection.
	-   **PIN:** Use PIN for quicker access.

5.** Complete Setup:** click the "Confirm" button after setting up the appropriate authentication method (password or PIN) to secure access to the site.

  

### 🔹 Accessing a Locked Website

1. **Open Protected Website:** When you or anyone else attempts to open a website protected by SiteLock, the extension will automatically intercept the request.

2. **Authentication Prompt:** Instead of directly loading the website content, SiteLock will redirect you to an **authentication page**. This page will prompt you to verify your identity.

3.**Verify Your Identity:** On the authentication page, you will need to authenticate using the method you set up for that specific website:
 -  **Enter your Password:** If you chose password protection, enter the password you configured.
-   **Enter your PIN:** If you opted for PIN protection, enter your designated PIN.
    
-   **Use Passkey:** If passkey authentication is enabled, follow the prompts to use your passkey device or method.

4. **Access Granted:** Upon successful verification of your credentials (correct password, PIN, or valid passkey), SiteLock will grant you access to the originally requested website. You will be automatically redirected to the intended website content and can begin browsing.

5. **Session Duration:** SiteLock intelligently manages your session. Once you have successfully authenticated, your access to the protected website will remain **active as long as you have at least one tab open for that site**. This means you can navigate freely within the website without needing to re-authenticate repeatedly during your browsing session.
6. **Automatic Session Revocation:** The security of SiteLock is enhanced by its automatic session management. As soon as you **close all open tabs related to the protected website**, SiteLock automatically revokes your access. This ensures that when you revisit the site later, or if someone else gains access to your browser after you're done, re-authentication will be required, maintaining a high level of security.

  

### 🔹 Managing Locked Websites

SiteLock provides an easy-to-use settings page to manage your protected websites:

1.  **Access Settings:** Click the SiteLock extension icon in your Chrome toolbar. In the extension popup, click on the **"Settings"** button.
2. **View Protected Websites:** The Settings page will display a comprehensive list of all websites that are currently protected by SiteLock. This list allows you to see all your secured sites at a glance.

3. **Manage Protection:** For each website in the list, you will have options to manage its protection settings. This typically includes:
	-   **Removing Protection:** Clicking the delete icon likely functions as a "Remove" action for that specific website. This would immediately or after confirmation remove SiteLock protection for the selected site.
    
	-   **Verification Prompts :** If SiteLock prioritizes security, clicking the delete icon may trigger a verification step, requiring you to enter a password, PIN, or passkey before the removal process is completed.

By using the Settings page, you have full control over your protected websites, allowing you to easily add, remove, and manage website protection as needed, all within a user-friendly interface.
  

## 🔒 Security Considerations

Understanding SiteLock's security model is important for optimal use:

- **In-Memory Authentication Data:** For enhanced security, authentication data and session states are **exclusively stored in your browser's memory**. This means that sensitive information is not persisted to disk, minimizing the risk of unauthorized access if your system is compromised while powered off. However, it also implies that:

-   **Session Reset on Browser Closure:** All authentication sessions and protected website access are completely **reset when you close your browser or restart your computer**. This is a deliberate security feature to ensure that every new browsing session starts with a clean security slate, requiring re-authentication for protected sites.
-   **Re-authentication After Tab Closure:** As a core security feature, you will **always need to re-authenticate** after you close all tabs of a protected website and then revisit it. This ensures that access is explicitly granted each time you intend to use a protected site, preventing persistent, unattended sessions.
-   **Origin-Level Protection:** SiteLock enforces protection at the **origin level**. This is a crucial security design choice to prevent subdomain bypasses. Protecting a domain like `example.com` automatically extends protection to all its subdomains (e.g., `blog.example.com`, `api.example.com`). This ensures comprehensive security for the entire website and its related services, simplifying protection management and eliminating potential security loopholes through subdomains.

  

## 🤝 Contributing

 We warmly welcome contributions to SiteLock! Help us make it even more secure and user-friendly. Here's how you can contribute:

We welcome contributions! To contribute:

1. **Fork the Repository:** Begin by forking the SiteLock repository to your own GitHub account. This creates a personal copy of the project where you can make changes.

2. **Create a Feature Branch:** For each feature addition or bug fix, create a dedicated branch. Use a descriptive branch name that clearly indicates the purpose of your changes:
	```bash
	git checkout -b feature-new-authentication-method
	```
	or
	```bash
	git checkout -b bugfix-session-timeout
	```
3. **Implement Your Changes:** Make your code modifications, enhancements, or bug fixes within your feature branch. Ensure your code is well-commented, follows project conventions, and includes tests if applicable.
4. **Commit Your Changes:** Commit your changes with clear, concise, and descriptive commit messages. Adhere to good commit message practices to explain the "what" and "why" of your changes.
	```bash
	git commit -m "fix: Resolve session timeout issue on tab close"
	```
5. **Push to Your Branch:** Push your feature branch to your forked repository on GitHub.
	```bash
	git push origin feature-new-authentication-method
	```
6. **Open a Pull Request:** Once your changes are pushed, open a Pull Request (PR) from your feature branch to the main branch of the original SiteLock repository. In your PR, provide a clear title and a detailed description of your changes, including the problem it solves or the feature it adds. Be prepared to discuss your changes and address any feedback from the project maintainers.

We appreciate all forms of contribution, from code enhancements and bug fixes to documentation improvements and feature suggestions. Your contributions help make SiteLock a better security tool for everyone!
## 📜 License

  
SiteLock is released under the permissive **MIT License**. You are free to use, modify, and distribute this software as per the terms of the license. See the `LICENSE` file for complete license details.

  --
🔥 **Enhance your web security today with SiteLock! Take control of your online privacy and browse with confidence.**
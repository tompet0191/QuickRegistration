# QuickRegistration
Userscript that adds quick registration button to time reporting at VismaOnline

Tested with Tampermonkey but should work with Greasemonkey as well.

### Installation
- Install Tampermonkey browser plugin (https://www.tampermonkey.net/)
- From the Tampermonkey dashboard, click 'Utilities' tab
- Copy and add the following URL to 'Install URL': https://bit.ly/2wT0uT5
- Click 'Install'

### Usage 
To use, press the green button named Snabbregga in the top right corner.
Any not already reported normal weekday will be updated as an 8-hour workday.
![Alt text](/example-screenshot.png?raw=true "Added button 'Snabbregga'")

### Automatic updates in Tampermonkey
When a new version of the file is available, the script will be updated. It checks for new updates depending on your setting (default: daily) or by manually clicking 'Check for userscript updates' on the Tampermonkey icon in your browser.

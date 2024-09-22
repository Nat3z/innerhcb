# InnerHCB

A JavaScript library which allows for developers to use their personal **HCB Authentication token** to perform authenticated requests.

Check out [HCB](https://hackclub.com/hcb), the *foundation for your nonprofit* by Hack Club!

## Installation

```bash
$ npm install innerhcb 
```

## How to get your HCB Authentication Token

Go to [https://hcb.hackclub.com](https://hcb.hackclub.com) and go to the Inspect Element with ctrl + shift + i

Next, go to application > cookies > https://hcb.hackclub.com and copy the session_token.

### I'm too lazy to do all of that.

Just paste this code in your console to get your HCB Authentication Token!

```javascript
try { console.log(`%c ✨ Behold! Your HCB Auth Token! \n%c${document.cookie.split(";").find((s) => s.trim().startsWith("session_token")).split("=")[1]}`, 'background-color: red; color: white; font-weight: 800;', 'background-color: white; color: black;'); } catch { console.error("You must be logged into HCB to do this!"); }
```
# Submission checklist

Work through these in order. Each step has a check so you know it's done.

## 1. Review the content

- [ ] Read all three pages and correct anything that isn't accurate.
- [ ] Decide whether to keep `files/Hard_Gondaliya_Resume.pdf`. It includes
      your phone number, and it will be public.
- [ ] Replace the `https://github.com/Hard3007` project links with links to the
      specific repositories, if they're public.

**Check:** you'd be comfortable sending the site to a recruiter.

## 2. Put the code on GitHub

- [ ] Create a public repository named `Hard3007.github.io`.
- [ ] Push all the files to the `main` branch.

**Check:** the README and screenshot show on the repository page.

## 3. Format and lint

- [ ] Run `npm install`.
- [ ] If the class provides an ESLint config, replace `eslint.config.js` with it.
- [ ] Run `npm run format`, then `npm run lint`, and fix anything reported.
- [ ] Commit and push the formatted files.

**Check:** `npm run format:check` and `npm run lint` both finish with no
errors.

## 4. Deploy

- [ ] In the repository, open **Settings → Pages** and deploy from `main`,
      `/ (root)`.
- [ ] Open https://hard3007.github.io/ and test the headline, the project
      filter, the lab and the mobile menu (narrow the window).

**Check:** all three pages load on the live URL.

## 5. Validate

Run each live page through the W3C validator:

- [ ] https://validator.w3.org/nu/?doc=https://hard3007.github.io/
- [ ] https://validator.w3.org/nu/?doc=https://hard3007.github.io/projects.html
- [ ] https://validator.w3.org/nu/?doc=https://hard3007.github.io/lab.html

**Check:** no errors. Info messages about trailing slashes on void elements
come from Prettier and are not errors.

## 6. Record the video

- [ ] Follow `docs/video-script.md`.
- [ ] Upload it to YouTube as **Public**.
- [ ] Add the link to the README, under "Demo video".

**Check:** the video plays in a private or incognito browser window.

## 7. Finish the GenAI section

- [ ] In the README, fill in "What I changed or checked by hand" with what you
      actually changed.

**Check:** the section lists the model, the prompts and your own edits.

## 8. Submit

- [ ] Fill in the class Google Form with the live URL, the repository URL and
      the video URL.
- [ ] For the thumbnail, use
      `https://hard3007.github.io/docs/screenshots/home-desktop.png`.
- [ ] Submit the website URL on Canvas.

**Check:** open the form's links and thumbnail to make sure they work.

## 9. Code review

- [ ] Complete the code review assignment, following the class video.

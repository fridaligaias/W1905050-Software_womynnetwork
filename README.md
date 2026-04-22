# womyn.network Web App

### Requirements

Before running the project, make sure you have:

- Node.js installed: [https://nodejs.org/](https://nodejs.org/)
- an internet connection

### Project Setup

1. Unzip ```W1905050-Software_womynnetwork```.
2. Open a terminal in the ```\womyn-app``` project folder.
2. Install dependencies:

```bash
npm install
```

### Running the Web App

>On Windows:

- double-click `Run.bat`

>On macOS:

1. Open Terminal.
2. Make sure you're in the project folder. Type ```cd``` and drag ```\womyn-app``` into the Terminal if needed.
3. Make the script executable:

```bash
chmod +x Run.sh
```

4. Run it:

```bash
./Run.sh
```

> Run manually

1. Open a terminal in the project folder.
2. Start the Parcel development server:

```bash
npm start
```

3. Open the app in your browser at:

`http://localhost:1234`


### Logging In and Creating an Account

The platform is invite-only.

Invite code (Apr 2026):

`2026w1905050`

>If you do not already have an account

1. Run the web app.
2. On the landing page, choose **Sign Up**.
3. Enter:
   - a unique username (or choose a random generated one)
   - email address is OPTIONAL
   - a password
   - the invite code above
4. Tick both required agreement checkboxes.
5. Submit the form to create the account.
6. After signup, the app redirects to the feed automatically.


>If you already have an account

1. Run the web app.
2. Choose **Log In**.
3. Enter your username and password.
4. After login, you will be taken to the feed.

## How to Use the App


### 1. Feed

On the feed you can:

- browse posts 
- switch between **All**, **Friends**, and **Circles** filters
- like posts
- pin posts
- open a post thread
- preview recent comments

### 2. Create a post

Open the **Post** page from the navigation.

There are two posting modes:

- **Text Post**
- **Image Post**

For text posts:

1. Add a title (OPTIONAL).
2. Enter the post text.
3. Add comma-separated tags (OPTIONAL).
4. Click **Post** to publish.

For image posts:

1. Switch to **Image Post**.
2. Add a title (OPTIONAL).
3. Open the pre-made gallery and choose an image.
4. Click **Apply Privacy Cloak**.
5. Wait until the protected preview is ready.
6. Optionally tick the checkbox to also use the image as your profile picture.
7. Add comma-separated tags (OPTIONAL).
8. Click **Post** to publish.

### 3. Open a thread and comment

Click any post to open its thread. In the thread view you can:

- read the full post
- view all comments in time order
- write a new comment

To comment:

1. Type into the comment box.
2. Click **Post**.

### 4. Explore

- browse trending posts
- search by tags
- search for people

### 5. Profile

- view your bio and avatar
- edit your bio
- shuffle your generated avatar
- save profile changes
- see posts made by that user / your own if clicked your own

When viewing someone else’s profile, you can follow or unfollow them.

### 6. Notifications

The Notifications page shows updates when:

- someone follows you
- someone likes your post
- someone comments on your post
- you breach ToS rules

### 7. Circles

- browse available circles
- join or leave circles
- create a new circle
- open a circle feed
- post into a circle

### 8. Settings

The Settings page includes account controls such as logout and notification, dark/light mode preferences.

---


#### Technical Notes

- Frontend: vanilla JavaScript
- Bundler/dev server: Parcel
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- ML/image protection: TensorFlow.js + MobileNetV2
- Routing: hash-based SPA routing

----
- main entry file: [src/index.js](/Users/fridaligaias/Desktop/fypWOMYNtesting/womyn-app/src/index.js)
- app HTML shell: [src/index.html](/Users/fridaligaias/Desktop/fypWOMYNtesting/womyn-app/src/index.html)
- Firebase setup: [src/utils/firebase.js](/Users/fridaligaias/Desktop/fypWOMYNtesting/womyn-app/src/utils/firebase.js)

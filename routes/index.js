const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");
const { catchErrors } = require("../handlers/errorHandlers");

// Do work here
router.get("/", catchErrors(storeController.getStores));
router.get("/stores", catchErrors(storeController.getStores));
router.get("/stores/page/:page", catchErrors(storeController.getStores));

router.get("/add", authController.isLoogedIn, storeController.addStore);
router.post(
  "/add",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post(
  "/add/:id",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get("/stores/:id/edit", catchErrors(storeController.editStore));

router.get("/stores/:slug", catchErrors(storeController.getStore));

router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

router.get(
  "/hearts",
  authController.isLoogedIn,
  catchErrors(storeController.getHeartedStores)
);

router.get("/login", userController.loginForm);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/register", userController.registerForm);
router.post(
  "/register",
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get("/account", authController.isLoogedIn, userController.account);
router.post("/account", catchErrors(userController.updateAccount));
router.post("/account/forgot", catchErrors(authController.forgot));
router.get("/account/reset/:token", catchErrors(authController.resetPassword));
router.post(
  "/account/reset/:token",
  authController.confirmedPassword,
  catchErrors(authController.update)
);

router.get("/map", storeController.mapPage);

router.get("/top", catchErrors(storeController.getTopStores));

router.post(
  "/reviews/:id",
  authController.isLoogedIn,
  catchErrors(reviewController.addReview)
);

// API //

router.get("/api/v1/search", catchErrors(storeController.searchStores));
router.get("/api/v1/stores/near", catchErrors(storeController.mapStores));
router.post(
  "/api/v1/stores/:id/heart",
  catchErrors(storeController.heartStore)
);

module.exports = router;

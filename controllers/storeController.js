const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const User = mongoose.model("User");

const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed" }, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add store" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // no we resize:
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/stores/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;

  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: "desc" });

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render("stores", { title: "Stores", stores, page, pages, count });
};

exports.getStore = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    "author"
  );
  if (!store) return next();
  res.render("store", { title: store.name, store });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error("this ain`t ya store!");
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = "Point";
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the updated store
    runValidators: true,
  }).exec();

  req.flash(
    "success",
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`
  );
  res.redirect(`/stores/${store.id}/edit`);
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;

  const tagsPromise = Store.getTagsList();
  const tagQuery = tag || { $exists: true }; // if there is no tag param - fall back to all stores with a tag
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render("tags", { tag, tags, stores, title: "Tags" });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 10000, // meters
      },
    },
  };
  const stores = await Store.find(q)
    .select("slug name description photo location")
    .limit(10);
  res.json(stores);
};

exports.mapPage = async (req, res) => {
  res.render("map", { title: "Map" });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map((obj) => obj.toString());
  const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};

exports.getHeartedStores = async (req, res) => {
  const heartedStores = await Store.find({ _id: req.user.hearts });
  res.render("hearts", { heartedStores, title: "My favourites" });
};

exports.getTopStores = async (req, res) => {
  const topStores = await Store.getTopStores();
  res.render("topStores", { topStores, title: "Top 10 Stores" });
};

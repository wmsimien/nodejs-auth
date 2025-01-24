const Photo = require("../models/Photo");
const { uploadToCloudinary } = require("../helpers/cloudinaryHelpers");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const uploadImageController = async (req, res) => {
  try {
    console.log(req.userInfo.userId);
    console.log(req.file);
    // if file exist in req object
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required.  Please upload an image.",
      });
    }

    // upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.path);
    // store image url and publicId along w/ updated userId in db
    const newlyUploadedImage = new Photo({
      url,
      publicId,
      uploadedBy: req.userInfo.userId,
    });

    await newlyUploadedImage.save();

    // delete the file from local storage
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image: newlyUploadedImage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!  Please try again.",
    });
  }
};

// get all images/photos
const fetchImagesController = async (req, res) => {
  try {
    // pagination feature
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // sort by
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const totalImages = await Photo.countDocuments();
    const totalPages = Math.ceil(totalImages / limit);

    const sortObject = {};
    sortObject[sortBy] = sortOrder;

    // get images based on sort
    const images = await Photo.find({})
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    if (images) {
      res.status(200).json({
        success: true,
        currentPage: page,
        totalPages,
        totalImages,
        data: images,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!  Please try again.",
    });
  }
};

// delete images from cloudinary
const deleteImageController = async (req, res) => {
  try {
    // console.log("in deleteImageController", req.params.id);
    // get current image id to be deleted
    const getCurrentImageID = req.params.id;
    const userId = req.userInfo.userId;
    // console.log("getCurrentImageID: ", getCurrentImageID);
    // console.log("userId: ", userId);

    // find image in db
    const image = await Photo.findById(getCurrentImageID);
    // console.log("image: " + image);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found!",
      });
    }

    // console.log("image.uploadedBy.toString(): ", image.uploadedBy.toString());

    // check if this image is uploaded by current user
    if (image.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to delete this image uploaded by another user!",
      });
    }

    // delete image first from external storage (Cloudinary)
    await cloudinary.uploader.destroy(image.publicId);
    // deletee image from db
    await Photo.findByIdAndDelete(getCurrentImageID);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!  Please try again.",
    });
  }
};

module.exports = {
  uploadImageController,
  fetchImagesController,
  deleteImageController,
};

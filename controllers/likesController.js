const Like = require("../models/likeModel");

exports.create = async (req, res) => {
  try {
    const existing = await Like.findOne(req.body)
    if (existing) {
      return res.status(422).json({ error: 'Already Liked!' })
    }

    const like = new Like(req.body);
    await like.save();

    res.status(200).json({ message: 'Liked succesfully!', like })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const existing = await Like.findOneAndDelete(req.body)

    if (!existing) {
      return res.status(422).json({ error: 'Like does not exist' })
    }

    res.status(200).json({ message: 'Unliked succesfully!' })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

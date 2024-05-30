const Comment = require("../models/commentModel");

exports.create = async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();

    res.status(200).json({ message: 'Comment added succesfully!', comment })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    comment.set({ text: req.body.text });
    await comment.save()

    res.status(200).json({ message: "success", comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(204).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

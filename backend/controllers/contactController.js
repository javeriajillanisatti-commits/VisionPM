const ContactMessage = require("../models/ContactMessage");
const { sendMailInBackground } = require("../config/mailer");
const { emitToUser } = require("../config/realtime");

const invalidMessage = (res, message) =>
  res.status(400).json({ success: false, message });

// Create contact message
const createContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    const cleanFirstName = firstName?.trim();
    const cleanLastName = lastName?.trim() || "";
    const cleanEmail = email?.trim().toLowerCase();
    const cleanMessage = message?.trim();

    if (!cleanFirstName) return invalidMessage(res, "First name is required");
    if (cleanFirstName.length < 3)
      return invalidMessage(res, "First name must contain at least 3 characters");
    if (cleanFirstName.length > 50)
      return invalidMessage(res, "First name cannot exceed 50 characters");
    if (!/^[a-zA-Z\s'-]+$/.test(cleanFirstName))
      return invalidMessage(res, "First name can only contain letters, spaces, hyphens or apostrophes");

    if (cleanLastName) {
      if (cleanLastName.length < 3)
        return invalidMessage(res, "Last name must contain at least 3 characters");
      if (cleanLastName.length > 50)
        return invalidMessage(res, "Last name cannot exceed 50 characters");
      if (!/^[a-zA-Z\s'-]+$/.test(cleanLastName))
        return invalidMessage(res, "Last name can only contain letters, spaces, hyphens or apostrophes");
    }

    if (!cleanEmail) return invalidMessage(res, "Email is required");
    if (cleanEmail.length > 50)
      return invalidMessage(res, "Email cannot exceed 50 characters");
    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail) ||
      cleanEmail.includes("..") ||
      cleanEmail.startsWith(".") ||
      cleanEmail.endsWith(".") ||
      cleanEmail.includes("@.")
    ) {
      return invalidMessage(res, "Please enter a valid email address");
    }

    if (!cleanMessage) return invalidMessage(res, "Message is required");
    if (cleanMessage.length < 10)
      return invalidMessage(res, "Message must contain at least 10 characters");
    if (cleanMessage.length > 1000)
      return invalidMessage(res, "Message cannot exceed 1000 characters");
    if (!/[a-zA-Z]/.test(cleanMessage))
      return invalidMessage(res, "Please enter a meaningful message");
    if (/^(.)\1+$/.test(cleanMessage.replace(/\s/g, "")))
      return invalidMessage(res, "Please enter a meaningful message");
    if (/^(test|testing|hello|hi|abc|abcde|qwerty|ok|okay)$/i.test(cleanMessage))
      return invalidMessage(res, "Please enter a meaningful message");
    if (/^(www\.?|https?:\/\/)/i.test(cleanMessage))
      return invalidMessage(res, "Please enter a proper message instead of a URL");

    const meaningfulCharacters = cleanMessage.replace(/[\s.,!?'"-]/g, "");
    if (meaningfulCharacters.length < 5)
      return invalidMessage(res, "Please enter a meaningful message");

    const newMessage = await ContactMessage.create({
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      message: cleanMessage,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all contact messages
const getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update message",
    });
  }
};

// Reply to contact message
const replyToMessage = async (req, res) => {
  try {
    const { reply } = req.body;
    const cleanReply = reply?.trim();

    if (!cleanReply)
      return invalidMessage(res, "Reply message is required");
    if (cleanReply.length < 10)
      return invalidMessage(res, "Reply must contain at least 10 characters");
    if (cleanReply.length > 1000)
      return invalidMessage(res, "Reply cannot exceed 1000 characters");
    if (!/[a-zA-Z]/.test(cleanReply))
      return invalidMessage(res, "Please enter a meaningful reply");
    if (/^(.)\1+$/.test(cleanReply.replace(/\s/g, "")))
      return invalidMessage(res, "Please enter a meaningful reply");
    if (/^(ok|okay|test|testing|hello|hi|abc|abcde|qwerty)$/i.test(cleanReply))
      return invalidMessage(res, "Please enter a meaningful reply");
    if (/^(www\.?|https?:\/\/)/i.test(cleanReply))
      return invalidMessage(res, "Please enter a proper reply instead of a URL");

    const meaningfulCharacters = cleanReply.replace(/[\s.,!?'"-]/g, "");
    if (meaningfulCharacters.length < 5)
      return invalidMessage(res, "Please enter a meaningful reply");

    const contactMessage = await ContactMessage.findById(req.params.id);
    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // Save the reply first, then email it in the background (no waiting on SMTP)
    contactMessage.replies.push({
      message: cleanReply,
      repliedAt: new Date(),
      repliedBy: "Super Admin",
    });
    await contactMessage.save();

    const savedReply = contactMessage.replies[contactMessage.replies.length - 1];
    const setReplyStatus = (status) =>
      ContactMessage.updateOne(
        { _id: contactMessage._id, "replies._id": savedReply._id },
        { $set: { "replies.$.emailStatus": status } }
      );

    sendMailInBackground(
      {
        from: process.env.EMAIL_USER,
        to: contactMessage.email,
        subject: "Reply to your contact message",
        text: cleanReply,
      },
      {
        label: "Contact reply email",
        onSuccess: () => setReplyStatus("sent"),
        onError: async () => {
          await setReplyStatus("failed");
          emitToUser(req.user?.id, "email_failed", {
            type: "contact_reply",
            message: `Your reply was saved but the email to ${contactMessage.email} could not be delivered. Please try again.`,
          });
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: contactMessage,
    });
  } catch (error) {
    console.error("Reply Message Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

// Delete contact message
const deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

module.exports = {
  createContactMessage,
  getAllMessages,
  markMessageAsRead,
  deleteMessage,
  replyToMessage,
};
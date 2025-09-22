import Contact from "../models/Contact.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";

export const submitContact = async (req, res) => {
  try {
    const { name, email, phoneNumber, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email, and message are required",
      });
    }

    const contact = new Contact({
      name,
      email,
      phoneNumber,
      message,
    });

    const savedContact = await contact.save();

    res.status(201).json({
      message: "Thank you for contacting us! We'll get back to you soon.",
      contact: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        createdAt: savedContact.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .populate("respondedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate(
      "respondedBy",
      "name email"
    );

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    if (contact.status === "new") {
      contact.status = "read";
      await contact.save();
    }

    res.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { status, response, sendEmailToUser = true } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    if (status) {
      contact.status = status;
    }

    const admin = await User.findById(req.user.id);
    
    if (response !== undefined) {
      contact.response = response;
      if (response && status === "responded") {
        contact.respondedBy = req.user.id;
        contact.respondedAt = new Date();

        if (sendEmailToUser && response && contact.email) {
          try {
            await sendEmail({
              to: contact.email,
              subject: `Re: Your message to Hanan Ecommerce`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Hello ${contact.name},</h2>
                  
                  <p>Thank you for contacting Hanan Ecommerce. We appreciate your message.</p>
                  
                  <div style="margin: 20px 0; padding: 15px; background-color: #f7f7f7; border-left: 4px solid #666;">
                    <p style="font-style: italic; color: #666;">You wrote:</p>
                    <p>${contact.message.replace(/\n/g, '<br>')}</p>
                  </div>
                  
                  <p style="margin-bottom: 20px;">Here's our response:</p>
                  
                  <div style="margin: 20px 0; padding: 15px; background-color: #f0f8ff; border-left: 4px solid #0066cc;">
                    ${response.replace(/\n/g, '<br>')}
                  </div>
                  
                  <p>If you have any further questions, please don't hesitate to contact us again.</p>
                  
                  <p style="margin-top: 30px;">Best regards,<br>${admin?.name || 'Customer Support Team'}<br>Hanan Ecommerce</p>
                  
                  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                    <p>This is an automated response to your inquiry. Please do not reply to this email.</p>
                  </div>
                </div>
              `,
              text: `Hello ${contact.name},

Thank you for contacting Hanan Ecommerce. We appreciate your message.

You wrote:
${contact.message}

Here's our response:
${response}

If you have any further questions, please don't hesitate to contact us again.

Best regards,
${admin?.name || 'Customer Support Team'}
Hanan Ecommerce

This is an automated response to your inquiry. Please do not reply to this email.`
            });
            
            console.log(`Email response sent to ${contact.email}`);
          } catch (emailError) {
            console.error('Failed to send email response:', emailError);
            
          }
        }
      }
    }

    const updatedContact = await contact.save();
    const populatedContact = await Contact.findById(updatedContact._id).populate(
      "respondedBy",
      "name email"
    );

    res.json({
      message: "Contact updated successfully",
      contact: populatedContact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

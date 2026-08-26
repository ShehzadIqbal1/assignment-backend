const { Resend } = require("resend");

const websiteEmails = require("../config/websiteEmails");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactEmail = async ({ tag, name, email, phone, message }) => {
  const website = websiteEmails[tag];

  if (!website) {
    throw new Error("Invalid website tag");
  }

  const response = await resend.emails.send({
    from: website.from,

    to: website.to,

    reply_to: email,

    subject: `New Contact Form Submission - ${tag}`,

    html: `

        <h2>
        New Contact Request
        </h2>


        <p>
        <strong>Website:</strong>
        ${tag}
        </p>


        <p>
        <strong>Name:</strong>
        ${name}
        </p>


        <p>
        <strong>Email:</strong>
        ${email}
        </p>


        <p>
        <strong>Phone:</strong>
        ${phone}
        </p>


        <p>
        <strong>Message:</strong>
        </p>


        <p>
        ${message}
        </p>

        `,
  });

  return response;
};

module.exports = {
  sendContactEmail,
};

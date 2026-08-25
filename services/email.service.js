const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactEmail = async ({ name, email, phone, message }) => {
  const response = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,

    to: process.env.CONTACT_EMAIL,

    subject: `New Contact Form Submission - ${name}`,

    html: `

      <h2>
        New Contact Request
      </h2>


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

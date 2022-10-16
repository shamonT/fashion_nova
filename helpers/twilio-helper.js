const client = require("twilio")(
  process.env.ACCOUNTID,
  process.env.TOKENID
);
const serviceSid =process.env.SERVICEID;

module.exports = {
  doSms: (userData) => {
    return new Promise(async (resolve, reject) => {
      
      let res = {};
      console.log(userData);
      console.log("eeeeeeeeeeeeeeee");
      await client.verify
        .services(serviceSid)
        .verifications.create({
          to: `+91${userData.number}`,
          channel: "sms",
        })
        .then((reeee) => {
          res.valid = true;
          resolve(res);
          console.log(reeee);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },

  otpVerify: (otpData, userData) => {
    console.log(otpData);
    console.log(userData);

    return new Promise(async (resolve, reject) => {
      await client.verify
        .services(serviceSid)
        .verificationChecks.create({
          to: `+91${userData.number}`,
          code: otpData.otp,
        })
        .then((verifications) => {
          console.log(verifications);
          resolve(verifications.valid);
        });
    });
  },
};

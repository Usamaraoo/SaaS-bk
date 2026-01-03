import Stripe from "stripe";


const stripe = new Stripe('', {
  apiVersion: "2025-12-15.clover"
});

export default stripe
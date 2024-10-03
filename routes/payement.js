// Example using Node.js and Express with Stripe
const express = require('express');
const Stripe = require('stripe');
const stripe = Stripe('your-stripe-secret-key');

const app = express();
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { paymentMethodId, amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,  
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true, 
    });
    res.send({ success: true, paymentIntent });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});



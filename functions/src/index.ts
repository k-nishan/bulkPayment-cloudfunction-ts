import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import {NotificationMessage, PaymentData} from "./types";
import {Timestamp} from "firebase-admin/firestore";
import {fetchAddOnPackage, fetchSubscriptionByUserId, fetchSubscriptionPackage, fetchSubscriptionPackageById, saveMessageToNotificationCollection, updateSubscriptionPackage} from "./firebaseServices";
import { addAddOnPAckageToRemainingKM, addNextMonthSubscription, createAddOnNotification, createReactivatedNotification, fetchRemaininingKM, updatedWithRemainingKmClass, updateExtraKilometers } from "./remainingKmServices";

admin.initializeApp();

export const db = admin.firestore();

export const _remainingKM = "remainingKM";
export const _subscriptionPackages = "subscription_packages";
export const _addonPackages = "addons";
export const _notifications = "notifications"
export const _users = "users";
export const currentDate = new Date();
export const captureBulkPayment = functions.https.onRequest(async (req, res) => {
  console.log('Bulk payment executing....');

  if (req.method !== 'POST') {
    console.log('Invalid request method:', req.method);
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const body = req.body;

    const uids: string[] = body.custom1.includes(',')
      ? body.custom1.split(',').map((uid: string) => uid.trim())
      : [body.custom1];

    console.log('UIDs : ', uids);

    // Save payment once
    const paymentData: PaymentData = {
      merchantKey: body.merchantKey,
      statusCode: body.statusCode,
      payableTransactionId: body.payableTransactionId,
      paymentMethod: body.paymentMethod,
      payableOrderId: body.payableOrderId,
      invoiceNo: body.invoiceNo,
      payableAmount: body.payableAmount,
      payableCurrency: body.payableCurrency,
      statusMessage: body.statusMessage,
      paymentScheme: body.paymentScheme,
      cardHolderName: body.cardHolderName,
      cardNumber: body.cardNumber,
      paymentId: body.paymentId,
      uid: body.custom1, // store original (comma-separated if multiple)
      description: body.custom2,
      createdAt: Timestamp.now(),
    };

    const docRef = await db.collection('payments_bulk').add(paymentData);

    if (paymentData.statusMessage === 'FAILURE') {
      throw new Error('Payment Unsuccessful');
    }

    const paymentDescription = paymentData.description;

    for (const uid of uids) {
      const remainingKm = await fetchRemaininingKM(uid);
      console.log('remainingKm : ', remainingKm);

      const remainingKMWithNoExtra = updateExtraKilometers(remainingKm);
      console.log('remaining with no extra : ', remainingKMWithNoExtra);

      let notificationMessage: NotificationMessage | undefined;

      if (paymentDescription.toLowerCase().includes('addon')) {
        const parts = paymentDescription.split(' ');
        const addOnPackageRange = Number(parts[1]);

        if (isNaN(addOnPackageRange)) {
          throw new Error('Invalid number in the description');
        }

        const addOnPackage = await fetchAddOnPackage(addOnPackageRange);
        const updatedRemainingKm = addAddOnPAckageToRemainingKM(
          remainingKMWithNoExtra,
          addOnPackage
        );

        await updatedWithRemainingKmClass(updatedRemainingKm, uid);
        notificationMessage = createAddOnNotification();
      } else if (paymentDescription.toLowerCase().includes('main')) {
        const parts = paymentDescription.split(' ');
        const subscriptionPackageRange = Number(parts[1]);
        console.log('subscriptionPackageRange : ', subscriptionPackageRange);

        if (isNaN(subscriptionPackageRange)) {
          throw new Error('Invalid number in the description');
        }

        // when paying for bulk subscriptions then the subscriptionPackageRange is 0
        const newSubscriptionPackage = subscriptionPackageRange !== 0
          ? await fetchSubscriptionPackage(subscriptionPackageRange) 
          : await fetchSubscriptionByUserId(uid);
        let currentSubscriptionPackage = newSubscriptionPackage;

        if (
          newSubscriptionPackage.docId !== remainingKMWithNoExtra.subscribedKM.subscribedId
        ) {
          console.log('updating the package ...')
          updateSubscriptionPackage(uid, newSubscriptionPackage.docId)
          currentSubscriptionPackage = await fetchSubscriptionPackageById(
            remainingKMWithNoExtra.subscribedKM.subscribedId
          );
        }

        const updatedRemainingKm = addNextMonthSubscription(
          remainingKMWithNoExtra,
          currentSubscriptionPackage,
          newSubscriptionPackage
        );

        await updatedWithRemainingKmClass(updatedRemainingKm, uid);
        notificationMessage = createReactivatedNotification();
      }

      if (notificationMessage) {
        await saveMessageToNotificationCollection(uid, notificationMessage);
      }
    }

    res.status(200).send(`Payment data stored with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error processing bulk payment:', error);
    res.status(500).send('Internal Server Error');
  }
});



import {_addonPackages, _notifications, _subscriptionPackages, _users, _vehicles, db} from ".";
import {AddOnPackage, NotificationMessage, SubscriptionPackage, TBikeDetails} from "./types";
import * as admin from "firebase-admin";

export const fetchSubscriptionPackage =
   async (range:number) : Promise<SubscriptionPackage> => {
     const subscriptionPackageRef = db.collection(_subscriptionPackages);
     try {
       const querySnapshot = await subscriptionPackageRef
         .where("range", "==", range).limit(1).get();
       if (querySnapshot.empty) {
         throw new Error(`Not Matching packages for ${range}`);
       }
       const doc = querySnapshot.docs[0];
       return {docId : doc.id , ...doc.data()} as SubscriptionPackage;
     } catch (error) {
       throw new Error(error instanceof Error ?
         error.message : "An Error Occured" );
     }
   };

   export const fetchSubscriptionPackageById =
   async (docId : string) : Promise<SubscriptionPackage> => {
     const subscriptionPackageRef = db.collection(_subscriptionPackages).doc(docId);
    try {
        const doc = await subscriptionPackageRef.get();
        if (doc.exists) {
          return {docId : doc.id , ...doc.data()} as SubscriptionPackage;
        } else {
            throw new Error(`${_subscriptionPackages} Not found under ${docId}`)
        }
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An Error Occured")
    }
   };

export const fetchAddOnPackage =
  async (range:number) : Promise<AddOnPackage> => {
    const addonPackageRef = db.collection(_addonPackages);
    try {
      const querySnapshot = await addonPackageRef
        .where("range", "==", range).limit(1).get();
      if (querySnapshot.empty) {
        throw new Error(`Not Matching packages for ${range}`);
      }
        const doc = querySnapshot.docs[0];
        return {id:doc.id ,  ...doc.data()} as AddOnPackage;
      } catch (error) {
        throw new Error(error instanceof Error ?
            error.message : "An Error Occured" );
    }
};


export const saveMessageToNotificationCollection = async (userId : string , notificationMessage : NotificationMessage): Promise<void> => {
  try {
    const userDocRef = db.collection(_notifications).doc(userId);

    // Add the notification message to Firestore
    await userDocRef.set(
      {
        notifications: admin.firestore.FieldValue.arrayUnion(notificationMessage),
      },
      { merge: true } // Merge with existing data
    );
  } catch (error) {
    throw new Error(`Error in saving notification: ${error instanceof Error ? error.message : error}`);
  }
};

export async function updateSubscriptionPackage(uid: string, subscriptionDocId: string): Promise<void> {
    const userRef = db.collection(_users).doc(uid);
  
    try {
      await userRef.update({
        selectedSubscription: subscriptionDocId,
      });
      console.log(`Successfully updated selectedSubscription for UID: ${uid}`);
    } catch (error) {
      console.error(`Failed to update subscription for UID: ${uid}`, error);
      throw new Error('Failed to update selected subscription.');
    }
  }

  export const fetchSubscriptionByUserId = async (uid: string): Promise<SubscriptionPackage> => {
    const userRef = db.collection(_users).doc(uid);
    console.log('Fetching subscription for UID:', uid);
    try {
      const userDoc = await userRef.get();
  
      if (!userDoc.exists) {
        throw new Error(`User not found with UID: ${uid}`);
      }
  
      const userData = userDoc.data();
      const subscriptionDocId = userData?.selectedSubscription;
  
      if (!subscriptionDocId) {
        throw new Error(`No selectedSubscription found for UID: ${uid}`);
      }
  
      return await fetchSubscriptionPackageById(subscriptionDocId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'An error occurred while fetching subscription.');
    }
  };

  export const fetchBikeByUid = async (uid: string): Promise<TBikeDetails> => {
    const vehiclesRef = db.collection(_vehicles);
    try {
      const querySnapshot = await vehiclesRef
        .where('uid', '==', uid)
        .limit(1)
        .get();
  
      if (querySnapshot.empty) {
        throw new Error(`No vehicle found for UID: ${uid}`);
      }
  
      const doc = querySnapshot.docs[0];
      return { bikeId: doc.id, ...doc.data() } as TBikeDetails;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  
  

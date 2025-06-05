import {Timestamp} from "firebase-admin/firestore";
import {AddOnPackage, AddonType, NotificationMessage, Packages, RemainingKM, subscribedKM, SubscriptionPackage} from "./types";
import {_remainingKM, db} from ".";



export const addAddOnPAckageToRemainingKM =
(remainingKM : RemainingKM, addonPackage : AddOnPackage): RemainingKM => {
    const currentDate = new Date()
  const endDate: Date = new Date();
  endDate.setDate(currentDate.getDate() + addonPackage.duration);
  const newPackage : Packages = {
    type: AddonType.addon,
    fullKm: addonPackage.range,
    kmRange: addonPackage.range,
    startDate: Timestamp.fromDate(currentDate),
    endDate: Timestamp.fromDate(endDate),
  };
  const updatedAdditionalKilometers =
    remainingKM.addOn.kiloMetres + addonPackage.range;
  remainingKM.addOn.kiloMetres = updatedAdditionalKilometers;
  remainingKM.addOn.packages.push(newPackage);
  return remainingKM;
};


export const addNextMonthSubscription = (remainigKM : RemainingKM , currentSubscriptionPackage : SubscriptionPackage , newMonthSubscription : SubscriptionPackage) => {

    let additionalPackage : Packages | undefined;
    const currentDateTime = new Date()
    let additionalkilometers = remainigKM.addOn.kiloMetres;
    //TODO: see base plan adding to addon.kilometers
    //TODO: check baseplan expirion period

    if(remainigKM.subscribedKM.endingTimeStamp.toDate() >= currentDateTime) {
      additionalPackage = {
          fullKm: currentSubscriptionPackage.range,
          kmRange: remainigKM.subscribedKM.kilometerRange,
          endDate: remainigKM.subscribedKM.endingTimeStamp,
          startDate: remainigKM.subscribedKM.startingTimeStamp,
          type: AddonType.base,
      } 
    }

    if (remainigKM.subscribedKM.endingTimeStamp.toDate() < currentDateTime && remainigKM.subscribedKM.kilometerRange > 0) {
      const packageEndDate = new Date()
      packageEndDate.setDate(remainigKM.subscribedKM.startingTimeStamp.toDate().getDate() + currentSubscriptionPackage.validity)
      additionalPackage = {
          fullKm: currentSubscriptionPackage.range,
          kmRange: remainigKM.subscribedKM.kilometerRange,
          endDate: Timestamp.fromDate(packageEndDate),
          startDate: remainigKM.subscribedKM.startingTimeStamp,
          type: AddonType.rollover,
      }
    }
    

    const newSubscriptionStartingDate : Date = remainigKM.subscribedKM.endingTimeStamp.toDate()
    const newSubscriptionEndingDate : Date = new Date()
    newSubscriptionEndingDate.setDate(newSubscriptionStartingDate.getDate() + newMonthSubscription.duration)

    const newSubscribedKm : subscribedKM = {
        batteryData: remainigKM.subscribedKM.batteryData,
        kilometerRange: newMonthSubscription.range,
        startingTimeStamp: Timestamp.fromDate(newSubscriptionStartingDate),
        endingTimeStamp: Timestamp.fromDate(newSubscriptionEndingDate),
        ranKilometers: remainigKM.subscribedKM.ranKilometers,
        subscribedId: newMonthSubscription.docId,
    };

    remainigKM.subscribedKM = newSubscribedKm;
    
    if (additionalPackage) {
        remainigKM.addOn.packages.push(additionalPackage);
        remainigKM.addOn.kiloMetres = additionalkilometers;
    }

    return remainigKM;
}

export const updateExtraKilometers = (remainingKM : RemainingKM , newExtraKilometers = 0) => {
  remainingKM.addOn.extrakilometers = newExtraKilometers;
  return remainingKM
}


/**
   * saving the remaining kilometers in firestore
   * @param {RemainingKM} remainingKm remaining kilometers for relavant user
   * @param {string} uid userid/doc id in users collection
   */
export const updatedWithRemainingKmClass = async (
    remainingKm: RemainingKM,
    uid: string
  ): Promise<void> => {
    try {
      const remainingKmRef = db.collection(_remainingKM).doc(uid);
      await remainingKmRef.update(remainingKm);
      console.log("RemainingKM successfully updated.");
    } catch (error) {
      console.error(`Error in updating RemainingKM: ${error}`);
      throw new Error(`Error in updating RemainingKM: ${error}`);
    }
  };

  export const fetchRemaininingKM = async (uid: string) : Promise<RemainingKM> => {

    const remainingKMRef = db.collection(_remainingKM).doc(uid);
    try {
        const doc = await remainingKMRef.get();
        if (doc.exists) {
            return doc.data() as RemainingKM
        } else {
            throw new Error(`${_remainingKM} Not found under ${uid}`)
        }
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An Error Occured")
    }
  } 


  export const createReactivatedNotification = () : NotificationMessage => {
    return {
      createdAt : Timestamp.now(),
      isRead: false,
      message: "Your Main KM package has been re-activated. You’re ready to go!",
      title: "Main KM Package Re-activated!",
      type: "package",
    }
  }
  
  export const createAddOnNotification = (): NotificationMessage => {

    return {
      createdAt: Timestamp.now(),
    isRead: true,
    message: "Your Add-on KM package has been activated. Enjoy your ride!",
    title: "Add-on Package Activation Success",
    type: "package",
    }
  }
import {Timestamp} from "firebase-admin/firestore";

export type NotificationMessage = {
  createdAt: FirebaseFirestore.Timestamp; // Firestore's Timestamp
  isRead: boolean;
  title: string;
  message: string;
  type: string;
};

export interface PaymentData {
    merchantKey: string;
    statusCode: number;
    payableTransactionId: string;
    paymentMethod: number;
    payableOrderId: string;
    invoiceNo: string;
    payableAmount: string;
    payableCurrency: string;
    statusMessage: string;
    paymentScheme: string;
    cardHolderName: string;
    cardNumber: string;
    paymentId: string;
    uid: string;
    description: string;
    createdAt: FirebaseFirestore.FieldValue;
  }

export type SubscriptionPackage = {
  docId: string;
    id: string;
    price: number;
    range: number;
    duration: number;
    validity: number;
  }

export type AddOnPackage = {
  id:string;
    currency: string;
    duration: number;
    price: number;
    range: number;
  }

export type FloatingRider = {
  FCMToken?: string;
  bikeNumber: string;
  contactNumber: string;
  currentBatchId: string;
  email: string;
  firstname: string;
  lastname: string;
  logins: number;
  name: string;
  nic: string;
  paymentId: string;
  profilePic: string;
  selectedBike: string;
  selectedSubscription: string;
  userRole: string;
};

export enum AddonType {
  "addon" = "addon",
  "base" = "base",
  "rollover" = "rollover",
  "relief" = "relief",
}

export type AddOn = {
  kiloMetres: number;
  extrakilometers? : number
  packages: Packages[];
};

export type Packages = {
  endDate: Timestamp;
  fullKm: number;
  kmRange: number;
  startDate: Timestamp;
  type: AddonType;
};

export type BatteryData = {
  assignedDate: Timestamp;
  batteryId: string;
  endKm: number | null;
  initKm: number;
};

export type subscribedKM = {
  batteryData: BatteryData[];
  endingTimeStamp: Timestamp;
  startingTimeStamp: Timestamp;
  kilometerRange: number;
  ranKilometers: number;
  subscribedId: string;
};

export type RemainingKM = {
  addOn: AddOn;
  subscribedKM: subscribedKM;
  totalBikeKm: number;
};

export type OperatinalStatus = "Station Assigned" |
"Rider Assigned" |
"In Store" |
"Out of Operation"

export type ChargerModule = {
  chargerId?: string;
  ts?: number;
}

export type BatteryModule = {
  id?: string;
  batteryId?: string;
  batteryPresent?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bms?: Record<string, any>;
  charger?: ChargerModule;
  chargerPresent?: boolean;
  deviceIdString?: string;
  gps?: number[];
  metrics?: number[];
  len?: number;
  tsValue?: number;
  operationalStatus?: OperatinalStatus;
};

export enum NotificationType {
  "battery" = "battery",
  "package" = "package",
}


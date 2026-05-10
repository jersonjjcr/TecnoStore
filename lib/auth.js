import { getCollection } from "@/lib/store";

const defaultUsers = [
  {
    id: "admin-1",
    name: "Administrador",
    email: "admin@tecnostore.com",
    password: "admin123",
    role: "admin",
    authorized: true,
    subscription: "Platinum",
    subscriptionStart: new Date().toISOString(),
    storeName: "Administración",
    createdAt: new Date().toISOString()
  },
  {
    id: "store-1",
    name: "Tienda Central",
    email: "tienda1@tecnostore.com",
    password: "tienda123",
    role: "store",
    authorized: true,
    subscription: "Pro",
    subscriptionStart: new Date().toISOString(),
    storeName: "Tienda Central",
    createdAt: new Date().toISOString()
  },
  {
    id: "store-2",
    name: "Tienda Norte",
    email: "tienda2@tecnostore.com",
    password: "tienda123",
    role: "store",
    authorized: true,
    subscription: "Basic",
    subscriptionStart: new Date().toISOString(),
    storeName: "Tienda Norte",
    createdAt: new Date().toISOString()
  }
];

const sessions = new Map();
const cookieName = "tecnostore_session";
let userSeedPromise;

async function getUsersCollection() {
  const collection = await getCollection("users");
  await ensureUserSeed(collection);
  return collection;
}

async function ensureUserSeed(collection) {
  if (!userSeedPromise) {
    userSeedPromise = (async () => {
      const count = await collection.countDocuments();
      if (count === 0) {
        await collection.insertMany(defaultUsers);
      }
    })().catch((error) => {
      userSeedPromise = undefined;
      throw error;
    });
  }

  await userSeedPromise;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

export async function findUserByEmail(email) {
  const usersCollection = await getUsersCollection();
  return await usersCollection.findOne({ email: email.toLowerCase() }) || null;
}

export async function loginUser(email, password) {
  const user = await findUserByEmail(email);

  if (!user || user.password !== password) {
    return null;
  }

  if (user.role === "store" && !user.authorized) {
    return null;
  }

  const token = crypto.randomUUID();
  sessions.set(token, sanitizeUser(user));
  return token;
}

export function getUserFromToken(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

export function deleteSession(token) {
  if (!token) return false;
  return sessions.delete(token);
}

export async function getAllStoreProfiles() {
  const usersCollection = await getUsersCollection();
  const stores = await usersCollection.find({ role: "store" }).toArray();
  return stores.map((store) => ({
    id: store.id,
    name: store.name,
    email: store.email,
    role: store.role,
    authorized: store.authorized,
    subscription: store.subscription,
    storeName: store.storeName,
    subscriptionStart: store.subscriptionStart,
    createdAt: store.createdAt,
    approvedAt: store.approvedAt || null
  }));
}

export async function registerStore({ storeName, email, password, subscriptionPlan, paymentAmount }) {
  if (paymentAmount !== 25) {
    throw new Error("El pago debe ser de 25 dólares.");
  }

  const usersCollection = await getUsersCollection();
  const normalizedEmail = email.toLowerCase();
  const existingUser = await usersCollection.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("El correo ya está registrado.");
  }

  const store = {
    id: `store-${crypto.randomUUID()}`,
    name: storeName,
    email: normalizedEmail,
    password,
    role: "store",
    authorized: false,
    subscription: subscriptionPlan || "Pro",
    subscriptionStart: new Date().toISOString(),
    storeName,
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentAmount
  };

  await usersCollection.insertOne(store);
  return sanitizeUser(store);
}

export async function authorizeStore(id) {
  const usersCollection = await getUsersCollection();
  const result = await usersCollection.updateOne(
    { id, role: "store" },
    {
      $set: {
        authorized: true,
        status: "active",
        approvedAt: new Date().toISOString()
      }
    }
  );

  if (!result.modifiedCount) {
    throw new Error("La tienda no existe.");
  }

  const store = await usersCollection.findOne({ id });
  return sanitizeUser(store);
}

export function getSessionCookieName() {
  return cookieName;
}

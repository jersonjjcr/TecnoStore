import { MongoClient } from "mongodb";

const defaultProducts = [];

const defaultSales = [];

const defaultRepairs = [];

const dbName = process.env.MONGODB_DB || "tecnostore";

const globalForMongo = globalThis;

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(dbName);
}

function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Falta la variable de entorno MONGODB_URI.");
  }

  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = new MongoClient(uri, {
      maxPoolSize: 10
    }).connect();
  }

  return globalForMongo._mongoClientPromise;
}

function serialize(document) {
  if (!document) return document;

  const { _id, ...rest } = document;
  return rest;
}

async function getCollection(name) {
  const db = await getDatabase();
  await ensureSeedData(db);
  return db.collection(name);
}

let seedPromise;

async function ensureSeedData(db) {
  if (!seedPromise) {
    seedPromise = (async () => {
      const productsCollection = db.collection("products");
      const hasProducts = await productsCollection.countDocuments();

      if (hasProducts > 0) {
        return;
      }

      await Promise.all([
        productsCollection.insertMany(defaultProducts),
        db.collection("sales").insertMany(defaultSales),
        db.collection("repairs").insertMany(defaultRepairs)
      ]);
    })().catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  }

  await seedPromise;
}

export async function getProducts() {
  const collection = await getCollection("products");
  const products = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return products.map(serialize);
}

export async function addProduct(input) {
  const collection = await getCollection("products");
  const product = {
    id: `prod-${crypto.randomUUID()}`,
    name: input.name.trim(),
    category: input.category.trim(),
    stock: Number(input.stock),
    price: Number(input.price),
    createdAt: new Date().toISOString()
  };

  await collection.insertOne(product);
  return product;
}

export async function deleteProduct(id) {
  const collection = await getCollection("products");
  const result = await collection.deleteOne({ id });

  if (!result.deletedCount) {
    throw new Error("El producto no existe.");
  }

  return { id };
}

export async function getSales() {
  const collection = await getCollection("sales");
  const sales = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return sales.map(serialize);
}

export async function addSale(input) {
  const productsCollection = await getCollection("products");
  const salesCollection = await getCollection("sales");
  const quantity = Number(input.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La cantidad debe ser mayor que cero.");
  }

  const product = await productsCollection.findOne({ id: input.productId });

  if (!product) {
    throw new Error("El producto seleccionado no existe.");
  }

  const updateResult = await productsCollection.updateOne(
    { id: product.id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } }
  );

  if (!updateResult.modifiedCount) {
    throw new Error(`Stock insuficiente para ${product.name}.`);
  }

  const sale = {
    id: `sale-${crypto.randomUUID()}`,
    customer: input.customer.trim(),
    productId: product.id,
    productName: product.name,
    quantity,
    payment: input.payment,
    total: product.price * quantity,
    createdAt: new Date().toISOString()
  };

  await salesCollection.insertOne(sale);
  return sale;
}

export async function deleteSale(id) {
  const productsCollection = await getCollection("products");
  const salesCollection = await getCollection("sales");

  const sale = await salesCollection.findOne({ id });
  if (!sale) {
    throw new Error("La venta no existe.");
  }

  await salesCollection.deleteOne({ id });

  await productsCollection.updateOne(
    { id: sale.productId },
    { $inc: { stock: sale.quantity } }
  );

  return { id };
}

export async function getRepairs() {
  const collection = await getCollection("repairs");
  const repairs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return repairs.map(serialize);
}

export async function addRepair(input) {
  const collection = await getCollection("repairs");
  const repair = {
    id: `rep-${crypto.randomUUID()}`,
    customer: input.customer.trim(),
    phone: input.phone.trim(),
    device: input.device.trim(),
    issue: input.issue.trim(),
    estimate: Number(input.estimate),
    status: "recibida",
    createdAt: new Date().toISOString()
  };

  await collection.insertOne(repair);
  return repair;
}

export async function deleteRepair(id) {
  const collection = await getCollection("repairs");
  const result = await collection.deleteOne({ id });

  if (!result.deletedCount) {
    throw new Error("La orden de servicio no existe.");
  }

  return { id };
}

export async function advanceRepair(id) {
  const collection = await getCollection("repairs");
  const repair = await collection.findOne({ id });

  if (!repair) {
    throw new Error("La orden de reparacion no existe.");
  }

  const nextStatus =
    repair.status === "recibida"
      ? "revision"
      : repair.status === "revision"
        ? "lista"
        : repair.status === "lista"
          ? "entregada"
          : "entregada";

  await collection.updateOne({ id }, { $set: { status: nextStatus } });
  return { ...serialize(repair), status: nextStatus };
}

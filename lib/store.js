import { MongoClient } from "mongodb";

const defaultProducts = [
  {
    id: "prod-1",
    storeId: "store-1",
    name: "Cargador iPhone 20W",
    category: "Carga",
    stock: 15,
    price: 45000,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    storeId: "store-1",
    name: "Funda Silicon iPhone 13",
    category: "Protección",
    stock: 8,
    price: 25000,
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    storeId: "store-2",
    name: "Audífonos Bluetooth",
    category: "Audio",
    stock: 12,
    price: 80000,
    createdAt: new Date().toISOString()
  }
];

const defaultSales = [];
const defaultRepairs = [];

// Almacenamiento en memoria para cuando MongoDB no esté disponible
let inMemoryStorage = {
  products: [...defaultProducts],
  sales: [...defaultSales],
  repairs: [...defaultRepairs],
  users: []
};

const dbName = process.env.MONGODB_DB || "tecnostore";
const globalForMongo = globalThis;

async function getDatabase() {
  try {
    const client = await getMongoClient();
    return client.db(dbName);
  } catch (error) {
    console.warn("MongoDB no disponible, usando almacenamiento en memoria:", error.message);
    return null; // Indica que usaremos almacenamiento en memoria
  }
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

  if (db) {
    // Usar MongoDB
    await ensureSeedData(db);
    return db.collection(name);
  } else {
    // Usar almacenamiento en memoria como fallback
    return {
      name,
      isInMemory: true,
      find: async (query = {}) => {
        const data = inMemoryStorage[name] || [];
        return data.filter(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });
      },
      findOne: async (query) => {
        const data = inMemoryStorage[name] || [];
        return data.find(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        }) || null;
      },
      insertMany: async (docs) => {
        const data = inMemoryStorage[name] || [];
        data.push(...docs);
        inMemoryStorage[name] = data;
        return { acknowledged: true, insertedCount: docs.length };
      },
      insertOne: async (doc) => {
        const data = inMemoryStorage[name] || [];
        data.push(doc);
        inMemoryStorage[name] = data;
        return { acknowledged: true, insertedId: doc.id };
      },
      updateOne: async (query, update) => {
        const data = inMemoryStorage[name] || [];
        const index = data.findIndex(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });

        if (index === -1) return { modifiedCount: 0 };

        if (update.$inc) {
          Object.keys(update.$inc).forEach(key => {
            data[index][key] = (data[index][key] || 0) + update.$inc[key];
          });
        }

        if (update.$set) {
          Object.assign(data[index], update.$set);
        }

        inMemoryStorage[name] = data;
        return { modifiedCount: 1 };
      },
      deleteOne: async (query) => {
        const data = inMemoryStorage[name] || [];
        const index = data.findIndex(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });

        if (index === -1) return { deletedCount: 0 };

        data.splice(index, 1);
        inMemoryStorage[name] = data;
        return { deletedCount: 1 };
      },
      countDocuments: async () => {
        const data = inMemoryStorage[name] || [];
        return data.length;
      }
    };
  }
}

function applyStoreFilter(query = {}, user) {
  if (!user || user.role !== "store") {
    return query;
  }

  return { ...query, storeId: user.id };
}

function attachStoreId(document, user) {
  return {
    ...document,
    storeId: user?.role === "store" ? user.id : document.storeId || "admin"
  };
}

let seedPromise;

async function ensureSeedData(db) {
  if (!seedPromise) {
    seedPromise = (async () => {
      if (!db) {
        // Para almacenamiento en memoria, ya está inicializado arriba
        return;
      }

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

export { getCollection };

export async function getProducts(user) {
  const collection = await getCollection("products");
  const filter = applyStoreFilter({}, user);
  let products;

  if (collection.isInMemory) {
    products = await collection.find(filter);
  } else {
    products = await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  return products.map(serialize);
}

export async function addProduct(input, user) {
  const collection = await getCollection("products");
  const product = attachStoreId(
    {
      id: `prod-${crypto.randomUUID()}`,
      name: input.name.trim(),
      category: input.category.trim(),
      stock: Number(input.stock),
      price: Number(input.price),
      createdAt: new Date().toISOString()
    },
    user
  );

  await collection.insertOne(product);
  return product;
}

export async function deleteProduct(id, user) {
  const collection = await getCollection("products");
  const query = applyStoreFilter({ id }, user);
  const result = await collection.deleteOne(query);

  if (!result.deletedCount) {
    throw new Error("El producto no existe.");
  }

  return { id };
}

export async function getSales(user) {
  const collection = await getCollection("sales");
  const filter = applyStoreFilter({}, user);
  let sales;

  if (collection.isInMemory) {
    sales = await collection.find(filter);
  } else {
    sales = await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  return sales.map(serialize);
}

export async function addSale(input, user) {
  const productsCollection = await getCollection("products");
  const salesCollection = await getCollection("sales");
  const quantity = Number(input.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La cantidad debe ser mayor que cero.");
  }

  const productQuery = applyStoreFilter({ id: input.productId }, user);
  const product = await productsCollection.findOne(productQuery);

  if (!product) {
    throw new Error("El producto seleccionado no existe.");
  }

  if (product.stock < quantity) {
    throw new Error(`Stock insuficiente para ${product.name}. Solo hay ${product.stock} unidades disponibles.`);
  }

  await productsCollection.updateOne(productQuery, { $inc: { stock: -quantity } });

  const sale = attachStoreId(
    {
      id: `sale-${crypto.randomUUID()}`,
      customer: input.customer.trim(),
      productId: product.id,
      productName: product.name,
      quantity,
      payment: input.payment,
      total: product.price * quantity,
      createdAt: new Date().toISOString()
    },
    user
  );

  await salesCollection.insertOne(sale);
  return sale;
}

export async function deleteSale(id, user) {
  const productsCollection = await getCollection("products");
  const salesCollection = await getCollection("sales");
  const query = applyStoreFilter({ id }, user);

  const sale = await salesCollection.findOne(query);
  if (!sale) {
    throw new Error("La venta no existe.");
  }

  await salesCollection.deleteOne(query);
  await productsCollection.updateOne(applyStoreFilter({ id: sale.productId }, user), {
    $inc: { stock: sale.quantity }
  });

  return { id };
}

export async function getRepairs(user) {
  const collection = await getCollection("repairs");
  const filter = applyStoreFilter({}, user);
  let repairs;

  if (collection.isInMemory) {
    repairs = await collection.find(filter);
  } else {
    repairs = await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  return repairs.map(serialize);
}

export async function addRepair(input, user) {
  const collection = await getCollection("repairs");
  const repair = attachStoreId(
    {
      id: `rep-${crypto.randomUUID()}`,
      customer: input.customer.trim(),
      phone: input.phone.trim(),
      device: input.device.trim(),
      issue: input.issue.trim(),
      estimate: Number(input.estimate),
      status: "recibida",
      createdAt: new Date().toISOString()
    },
    user
  );

  await collection.insertOne(repair);
  return repair;
}

export async function deleteRepair(id, user) {
  const collection = await getCollection("repairs");
  const query = applyStoreFilter({ id }, user);
  const result = await collection.deleteOne(query);

  if (!result.deletedCount) {
    throw new Error("La orden de servicio no existe.");
  }

  return { id };
}

export async function advanceRepair(id, user) {
  const collection = await getCollection("repairs");
  const query = applyStoreFilter({ id }, user);
  const repair = await collection.findOne(query);

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

  await collection.updateOne(query, { $set: { status: nextStatus } });
  return { ...serialize(repair), status: nextStatus };
}

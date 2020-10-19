import colors from 'colors'
import connectDB from './config/db.js'
import dotenv from 'dotenv'
import products from './data/products.js'
import users from './data/users.js'
import Order from './model/orderSchema.js'
import Product from './model/productSchema.js'
import User from './model/userSchema.js'

dotenv.config()

connectDB()

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    const createdUser = await User.insertMany(users);

    const adminUser = createdUser[0]._id;

    const sampleProducts = products.map(product => {
      return { ...product, user: adminUser }
    })

    await Product.insertMany(sampleProducts)

    console.log('Data Imported'.green.inverse);
    process.exit()
  } catch (error) {
    console.log(`${error}`.red.inverse);
    process.exit(1)
  }
}

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed'.red.inverse);
    process.exit()
  } catch (error) {
    console.log(`${error}`);
    process.exit(1)
  }
}

if (process.argv[2] === '-d') {
  destroyData()
} else {
  importData()
}

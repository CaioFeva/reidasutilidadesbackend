const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log("Conectado ao banco de dados PostgreSQL"))
  .catch((err) => console.error("Erro ao conectar ao banco de dados", err));

app.get("/produto/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM produto WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const produto = result.rows[0];
    const produtoFormatado = {
      ...produto,
      price: produto.price ? parseFloat(produto.price) : 0.0,
    };

    res.json(produtoFormatado);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

app.get("/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produto");
    const produtos = result.rows.map((produto) => ({
      ...produto,
      price: produto.price ? parseFloat(produto.price) : 0.0,
    }));
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

app.post("/produtos", async (req, res) => {
  const {
    name,
    description,
    price,
    images,
    dimensions,
    weight,
    stock,
    category,
  } = req.body;

  // Validação básica dos campos obrigatórios
  if (!name || !price || !stock) {
    return res
      .status(400)
      .json({ error: "Os campos name, price e stock são obrigatórios" });
  }

  try {
    const query = `
        INSERT INTO produto (name, description, price, images, dimensions, weight, stock, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;

    const values = [
      name,
      description,
      price,
      images,
      dimensions,
      weight,
      stock,
      category,
    ];

    // Executa o comando INSERT e retorna o produto inserido
    const result = await pool.query(query, values);
    const newProduct = result.rows[0];

    res.status(201).json(newProduct); // Retorna o produto inserido com status 201 (Created)
  } catch (error) {
    console.error("Erro ao inserir produto:", error);
    res.status(500).json({ error: "Erro ao inserir produto" });
  }
});

// Endpoint PUT para atualizar um produto existente
app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    images,
    dimensions,
    weight,
    stock,
    category,
  } = req.body;

  console.log("images", images);

  try {
    // Verifica se o produto existe
    const result = await pool.query("SELECT * FROM produto WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Atualiza o produto
    const updateQuery = `
      UPDATE produto
      SET name = $1, description = $2, price = $3, images = $4, dimensions = $5, 
          weight = $6, stock = $7, category = $8
      WHERE id = $9
      RETURNING *
    `;
    const values = [
      name,
      description,
      price,
      images,
      dimensions,
      weight,
      stock,
      category,
      id,
    ];
    const updatedProduct = await pool.query(updateQuery, values);

    // Retorna o produto atualizado
    res.json(updatedProduct.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// Endpoint DELETE para excluir um produto
app.delete("/produtos/:id", (req, res) => {
  const { id } = req.params;

  const produtoExistente = produtos.find((produto) => produto.id === id);
  if (!produtoExistente) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }

  produtos = produtos.filter((produto) => produto.id !== id);
  res.status(204).send();
});

app.get("/categoria", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categorias");

    const categories = result.rows.map((row) => row.category);

    res.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

app.post("/categoria", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res
      .status(400)
      .json({ error: "Os campos categoria é obrigatórios" });
  }

  try {
    const query = ` INSERT INTO public.categorias (category)
                    VALUES($1)
                    RETURNING *;`;

    const values = [category];

    const result = await pool.query(query, values);
    const newCategory = result.rows[0];

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Erro ao inserir categoria:", error);
    res.status(500).json({ error: "Erro ao inserir categoria" });
  }
});

app.get("/boleto", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM boletos");

    const boletos = result.rows.map((row) => ({
      id: row.id,
      customername: row.customername,
      cpfcpnj: row.cpfcpnj,
      amount: row.amount,
      duedate: row.duedate,
      description: row.description,
      status: row.status,
    }));

    res.json(boletos);
  } catch (error) {
    console.error("Erro ao buscar boletos:", error);
    res.status(500).json({ error: "Erro ao buscar boletos" });
  }
});

app.post("/boleto", async (req, res) => {
  const { customerName, cpfcnpj, amount, dueDate, description, status } =
    req.body;

  if ((!customerName, !cpfcnpj, !amount, !dueDate, !description, !status)) {
    return res
      .status(400)
      .json({ error: "Os campos categoria é obrigatórios" });
  }

  try {
    const query = ` INSERT INTO public.boletos (customername, cpfcpnj, amount, duedate, description, status)
                    VALUES($1,$2,$3,$4,$5,$6)
                    RETURNING *;`;

    const values = [
      customerName,
      cpfcnpj,
      amount,
      dueDate,
      description,
      status,
    ];

    const result = await pool.query(query, values);
    const newBoleto = result.rows[0];

    res.status(201).json(newBoleto);
  } catch (error) {
    console.error("Erro ao inserir boleto:", error);
    res.status(500).json({ error: "Erro ao inserir boleto" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

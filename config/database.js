const mysql = require('mysql2');

// Configuração da conexão com MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Senha padrão do XAMPP é vazia
    database: 'techman',
    port: 3306,
    charset: 'utf8mb4'
};

// Criar pool de conexões para melhor performance
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisificar para usar async/await
const promisePool = pool.promise();

// Função para testar a conexão
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Conectado ao MySQL com sucesso!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com MySQL:', error.message);
        return false;
    }
};

// Função para executar queries
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await promisePool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Erro ao executar query:', error);
        throw error;
    }
};

// Função para executar queries de inserção e retornar o ID
const executeInsert = async (query, params = []) => {
    try {
        const [result] = await promisePool.execute(query, params);
        return result.insertId;
    } catch (error) {
        console.error('Erro ao executar insert:', error);
        throw error;
    }
};

module.exports = {
    pool: promisePool,
    testConnection,
    executeQuery,
    executeInsert
};


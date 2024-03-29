const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let DB = null;

//Initialization

const initializationServerAndDB = async () => {
  try {
    DB = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializationServerAndDB();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API - 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                And priority = '${priority}';`;

      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                And priority = '${priority}';`;

      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;

      break;

    default:
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;

      break;
  }

  data = await DB.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;
  const todoResponse = await DB.get(getTodosQuery);
  response.send(todoResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const todoPostQuery = `
    INSERT INTO 
        todo ( id, todo, priority, status )
    VALUES 
        (${id} , '${todo}' , '${priority}', '${status}');`;

  const dbResponse = await DB.run(todoPostQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";

      break;

    case requestBody.priority !== undefined:
      updateColumn = "Priority";

      break;

    case requestBody.todo !== undefined:
      updateColumn = "Todo";

      break;
  }

  const previousTodoQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;

  const previousTodo = await DB.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoId};`;

  await DB.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;

  await DB.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

import inquirer from 'inquirer';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

await client.connect();

async function mainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit',
      ],
    },
  ]);

  switch (action) {
    case 'View all departments':
      const departments = await client.query('SELECT * FROM department');
      console.table(departments.rows);
      break;

    case 'View all roles':
      const roles = await client.query(`
        SELECT role.id, role.title, department.name AS department, role.salary 
        FROM role 
        JOIN department ON role.department_id = department.id
      `);
      console.table(roles.rows);
      break;

    case 'View all employees':
      const employees = await client.query(`
        SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary,
        CONCAT(m.first_name, ' ', m.last_name) AS manager
        FROM employee e
        LEFT JOIN role ON e.role_id = role.id
        LEFT JOIN department ON role.department_id = department.id
        LEFT JOIN employee m ON e.manager_id = m.id
      `);
      console.table(employees.rows);
      break;

    case 'Add a department':
      const { deptName } = await inquirer.prompt({
        type: 'input',
        name: 'deptName',
        message: 'Enter department name:',
      });
      await client.query('INSERT INTO department (name) VALUES ($1)', [deptName]);
      console.log(`Added department: ${deptName}`);
      break;

    case 'Add a role':
      const depts = await client.query('SELECT * FROM department');
      const { roleTitle, roleSalary, deptId } = await inquirer.prompt([
        { type: 'input', name: 'roleTitle', message: 'Enter role title:' },
        { type: 'input', name: 'roleSalary', message: 'Enter salary:' },
        {
          type: 'list',
          name: 'deptId',
          message: 'Select department:',
          choices: depts.rows.map(dept => ({ name: dept.name, value: dept.id })),
        },
      ]);
      await client.query(
        'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
        [roleTitle, roleSalary, deptId]
      );
      console.log(`Added role: ${roleTitle}`);
      break;

    case 'Add an employee':
      const rolesData = await client.query('SELECT * FROM role');
      const employeesData = await client.query('SELECT * FROM employee');
      const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
        { type: 'input', name: 'firstName', message: "Enter employee's first name:" },
        { type: 'input', name: 'lastName', message: "Enter employee's last name:" },
        {
          type: 'list',
          name: 'roleId',
          message: "Select employee's role:",
          choices: rolesData.rows.map(role => ({ name: role.title, value: role.id })),
        },
        {
          type: 'list',
          name: 'managerId',
          message: "Select employee's manager:",
          choices: [{ name: 'None', value: null }].concat(
            employeesData.rows.map(emp => ({
              name: `${emp.first_name} ${emp.last_name}`,
              value: emp.id,
            }))
          ),
        },
      ]);
      await client.query(
        'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
        [firstName, lastName, roleId, managerId]
      );
      console.log(`Added employee: ${firstName} ${lastName}`);
      break;

    case 'Update an employee role':
      const emps = await client.query('SELECT * FROM employee');
      const rolesList = await client.query('SELECT * FROM role');
      const { empId, newRoleId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'empId',
          message: 'Select employee to update:',
          choices: emps.rows.map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id,
          })),
        },
        {
          type: 'list',
          name: 'newRoleId',
          message: 'Select new role:',
          choices: rolesList.rows.map(role => ({ name: role.title, value: role.id })),
        },
      ]);
      await client.query('UPDATE employee SET role_id = $1 WHERE id = $2', [newRoleId, empId]);
      console.log(`Updated employee's role.`);
      break;

    case 'Exit':
      console.log('Goodbye!');
      await client.end();
      process.exit();
  }

  mainMenu();
}

mainMenu();
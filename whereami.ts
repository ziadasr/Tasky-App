/**
 * ======================================================================
 * to run
 * run the wsl redis server --> redis cli --> redis-server ==================== wsl --> sudo service redis-server start test by :redis-cli ping
 * run the backend server --> npm run dev
 * run the worker --> npm run worker:dev
 * =======================================================================
 * run the frontend server --> npm run dev
 *
 */

//reset_auth_token      ==> validation by the backend done
//normal login token    ==> validation by the backend done
//registration by admin ==> integrated with the frontend
//login                 ==> integrated with the frontend
//!mailing issue the mail sending is missing for now
//verify code           ==> integrated with the frontend
//change password       ==> integrated with the frontend
//the reset_auth_token is deleted and then give a new token "token"

//*app flow changed
//user is regestered by admin with a default password "TempPassword"
//on first login user is required to change the password and provide extra info
//after changing the password successfully the user can login normally

//*implementing the Task Model and Task Management
//task model done
//create task done
//get user tasks done
//redis server through wsl
//integerate redis with the backend create tasks for delayed tasks and recurring tasks
//start task and end by user and integrated with the frontend

//*intgerate the the tasks with front end
//create task                                          ==> integrated with the frontend
//get user tasks                                       ==> integrated with the frontend
//get all Direct Employees for manager to assign tasks ==> integrated with the frontend

//user change task status

//*status filtering by role
//normal users see          ==> pending, in_progress, completed, all
//admins/managers see       ==> pending, in_progress, scheduled, completed, all
//due and archived removed for all users

//add archioive and alloww user to move completed tasks to archive

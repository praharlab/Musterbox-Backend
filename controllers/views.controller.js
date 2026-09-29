const { usermessage } = require('../response_message/message');
const { executeQuery } = require('./common.controller');
const views = [
  {
    title: 'user',
    viewName: 'userlist',
    definition: `DROP VIEW IF EXISTS userlist;
        CREATE OR REPLACE VIEW userlist as SELECT "firstName", "lastName" from public."userMasters";`,
  },
  // {
  //   title: 'company',
  //   viewName: 'companylist',
  //   definition: `DROP VIEW IF EXISTS companylist;
  //           CREATE OR REPLACE VIEW companylist as SELECT "companyName" from public."companyMasters";`,
  // },
  {
    title: 'country',
    viewName: 'countrylist',
    definition: `DROP VIEW IF EXISTS countrylist;
            CREATE OR REPLACE VIEW countrylist as SELECT "countryName" from public."countryMasters";`,
  },
  // {
  //   title: 'EmployeeDetails',
  //   viewName: 'Ms_View_EmployeeDetails',
  //   definition: `DROP VIEW IF EXISTS Ms_View_EmployeeDetails;
  //           CREATE OR REPLACE VIEW Ms_View_EmployeeDetails as select UM."displayName" as EmpName,UM."userNumber" as Mobile,UM."companyMasterId" ,UM."gender",
  //           UM."email",EmpDetails."employeeCode",EmpDetails."dob",
  //           EmpDetails."joiningDate",EmpDetails."adharCard",EmpDetails."esicNumber",EmpDetails."pfNumber",
  //           EmpDetails."pancard",EmpDetails."bankIFSC",EmpDetails."bankAccountNo",EmpDetails."retirementAge",
  //           EmpDetails."retirementDate",EmpDetails."salaryCalculationAct",bank."bankName",
  //           UM."userMasterID"
  //           from public."userMasters" as UM
  //           Left Outer join public."employeeDesignations" as EmpDesig on UM."userMasterID"=EmpDesig."userMasterID" and EmpDesig."endDate"<> null
  //           Left OUter Join public."employeeJoiningDetails" as EmpDetails on UM."userMasterID"=EmpDetails."userMasterID"
  //           Left Outer Join  public."employeeDepartments" as EmpDept on UM."userMasterID"=EmpDetails."userMasterID" and EmpDept."endDate"<> null
  //           Left Outer Join public."bankMasters" as bank on EmpDetails."bankMasterID"=bank."bankMasterID"
  //           Left Outer Join public."departments" as dept on EmpDept."employeeDepartmentID"=dept."departmentId"
  //           Left Outer Join public."designations" as desig on EmpDesig."employeeDesignationID"=desig."designationId"
  //           where UM."status"=1;
  //       `,
  // },
  {
    title: 'Form16',
    viewName: 'Ms_View_GetForm16',
    definition: ` DROP VIEW IF EXISTS Ms_View_GetForm16;
        Create OR REPLACE VIEW Ms_View_GetForm16 as
        select  F1."Form16ID",F1."SalaryDetails",F1."Series" ,F1."ParentForm16ID",
        FC1."Form16ChildID",FC1."Form16ID" as LinkFormno16id,FC1."GrossAmount",FC1."QualifyingAmount",
        FC1."StartDate",FC1."EndDate"
        , (select "SalaryDetails" from public."form16s"   where "Form16ID"=F1."ParentForm16ID") as UnderDetailsofSalary
        from "form16s" as F1 Left Join "form16children" as FC1 on F1."Form16ID"=FC1."Form16ID"
        where F1."status"=1 
        ORDER by "Form16ID" ASC;

        `,
  },
  {
    title: 'MenuList',
    viewName: 'Ms_View_GetMenuList',
    definition: `
        DROP VIEW IF EXISTS Ms_View_GetMenuList;
        Create OR REPLACE VIEW Ms_View_GetMenuList as
                    select 
                    F1."icon",F1."formName" as  Lable,F1."formName" as Menu,F1."path",F1."formMasterID",F1."parentFormMasterID"
                    ,F1."formName" as  MainMenu
                    from public."formMasters" as F1 where F1."parentFormMasterID" is null
                    and F1."status"=1
                    union all 
                    select 
                    F2."icon",F2."formName" as  Lable,F2."formName" as Menu,F2."path",F2."formMasterID",F2."parentFormMasterID"
                    ,F1."formName" as  MainMenu
                    from public."formMasters" as F1 inner Join public."formMasters" as F2 on F1."formMasterID" = F2."parentFormMasterID"
                    where  F2."status"=1
        `,
  },
  {
    title: 'MonthNameList',
    viewName: 'ms_view_monthnamelist',
    definition: `
        DROP VIEW IF EXISTS ms_view_monthnamelist;
        Create OR REPLACE VIEW ms_view_monthnamelist as
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-01-01 20:38:40')::text, 'MM'), 'Month') as Month,1 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-02-01 20:38:40')::text, 'MM'), 'Month') as Month,2 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-03-01 20:38:40')::text, 'MM'), 'Month') as Month,3 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-04-01 20:38:40')::text, 'MM'), 'Month') as Month,4 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-05-01 20:38:40')::text, 'MM'), 'Month') as Month,5 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-06-01 20:38:40')::text, 'MM'), 'Month') as Month,6 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-07-01 20:38:40')::text, 'MM'), 'Month') as Month,7 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-08-01 20:38:40')::text, 'MM'), 'Month') as Month,8 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-09-01 20:38:40')::text, 'MM'), 'Month') as Month,9 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-10-01 20:38:40')::text, 'MM'), 'Month') as Month,10 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-11-11 20:38:40')::text, 'MM'), 'Month') as Month,11 as Number
        union all
        SELECT to_char(to_timestamp (date_part('month', timestamp '2022-12-01 20:38:40')::text, 'MM'), 'Month') as Month,12 as Number
        `,
  },
];

let createMethod = (name) => {
  return async function (req, res, next) {
    let result = await executeQuery('SELECT * from public.' + name);
    res.status(200).json({
      status: 200,
      message: 'SELECT * from public.' + name,
      data: result,
    });
  };
};

for (var view of views) {
  exports['get' + view.title] = createMethod(view.viewName);
}

exports.views = views;

exports.createViews = async (req, res, next) => {
  try {
    let result;
    for (const v of views) {
      result = await executeQuery(v['definition']);
    }
    res.status(200).json({ status: 200, message: usermessage.viewcreated });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

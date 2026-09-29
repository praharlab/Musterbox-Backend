const { usermessage } = require('../response_message/message');
const { executeQuery } = require('./common.controller');
const functions = [
  {
    title: 'getCompanyCount',
    name: 'getCompanyCount',
    definition: `
        CREATE OR REPLACE FUNCTION getCompanyCount ()
            RETURNS integer AS $total$
            declare
                total integer;
            BEGIN
            SELECT count(*) into total FROM public."companyMasters";
            RETURN total;
            END;
            $total$ LANGUAGE plpgsql;
        `,
  },
  {
    title: 'getSalaryStructure',
    name: 'MS_fun_getSalaryStructure',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_getsalarystructure(integer, integer, integer, integer);
        CREATE OR REPLACE FUNCTION MS_fun_getSalaryStructure (
            grade_structure_id INT,
            company_master_id INT,
            basic int,
			hra int
        )
            RETURNS TABLE (
                payheadName VARCHAR,
                fieldDefaultPer float,
                fieldFixAmount float,
                gradeName VARCHAR,
                gradeFrom INT,
                gradeTo INT,
                gradeSalaryStructureID INT,
                salaryFieldID INT,
                gradeStructureID INT,
                payheadMasterId INT,
                salaryFieldRound VARCHAR,
                salaryFieldRoundNo INT,
                salaryFieldIndex INT,
                salaryFieldSide VARCHAR,
                salaryFieldSrNo VARCHAR,
                salaryFieldFixVariable VARCHAR,
                sum_effective_value float,
				child_effective_amount float
            ) AS $$
            DECLARE 
                var_r record;
				sum_effective_value float;
				child_effective_amount float;
				payheadName VARCHAR;
                fieldDefaultPer float;
                fieldFixAmount float;
                gradeName VARCHAR;
                gradeFrom INT;
                gradeTo INT;
                gradeSalaryStructureID INT;
                salaryFieldID INT;
                gradeStructureID INT;
                payheadMasterId INT;
                salaryFieldRound VARCHAR;
                salaryFieldRoundNo INT;
                salaryFieldIndex INT;
                salaryFieldSide VARCHAR;
                salaryFieldSrNo VARCHAR;
                salaryFieldFixVariable VARCHAR;
            BEGIN
				drop table if exists temp_structure;
					create temp table temp_structure (
						payheadName VARCHAR,
						fieldDefaultPer float,
						fieldFixAmount float,
						gradeName VARCHAR,
						gradeFrom INT,
						gradeTo INT,
						gradeSalaryStructureID INT,
						salaryFieldID INT,
						gradeStructureID INT,
						payheadMasterId INT,
						salaryFieldRound VARCHAR,
						salaryFieldRoundNo INT,
                        salaryFieldIndex INT,
                        salaryFieldSide VARCHAR,
                        salaryFieldSrNo VARCHAR,
                        salaryFieldFixVariable VARCHAR,
                        sum_effective_value float,
				        child_effective_amount float
				);
                FOR var_r IN(
                    Select Phm."payheadName" as payheadName,
                    Gss."fieldDefaultPer" as fieldDefaultPer,
                    Gss."fieldFixAmount" as fieldFixAmount,
                    Gs."gradeName" as gradeName,
                    Gs."gradeFrom" as gradeFrom,
                    Gs."gradeTo" as gradeTo,
                    Gss."gradeSalaryStructureID" as gradeSalaryStructureID,
                    Sf."salaryFieldID" as salaryFieldID,
                    Gs."gradeStructureID" as gradeStructureID,
                    Sf."payheadMasterId" as payheadMasterId,
                    Sf."salaryFieldRound" as salaryFieldRound,
                    Sf."salaryFieldRoundNo" as salaryFieldRoundNo,
					Sf."salaryFieldMaxRange" as salaryFieldMaxRange,
                    Sf."salaryFieldIndex" as salaryFieldIndex,
                    Sf."salaryFieldSide" as salaryFieldSide,
                    Sf."salaryFieldSrNo" as salaryFieldSrNo,
                    Sf."salaryFieldFixVariable" as salaryFieldFixVariable
                From "gradeStructures" As Gs
                Inner join "gradeSalaryStructures" As Gss On Gs."gradeStructureID" = Gss."gradeStructureID"
                Inner join "hrSalaryFields" As Sf On Gss."salaryFieldID" = Sf."salaryFieldID"
                Inner join "Payheadmasters" As Phm On Sf."payheadMasterId" = Phm."payheadMasterId"
                Where Gs."status" = 1
                    And Sf."salaryFieldInactiveDate" Isnull
                    And Sf."salaryFieldShowInCTC" = 'Y'
                    And Gs."gradeStructureID" = grade_structure_id
                    And Gs."companyMasterID" = company_master_id
                Order by Sf."salaryFieldIndex",
                    Sf."salaryFieldSide"
                    )  
                LOOP
                    payheadName := upper(var_r.payheadName) ;
                    fieldDefaultPer := var_r.fieldDefaultPer ;
					IF var_r.payheadMasterId = 2 THEN
	                    fieldFixAmount := basic ;
					ELSIF var_r.payheadMasterId = 3 THEN
	                    fieldFixAmount := hra ;
                    ELSIF var_r.salaryFieldFixVariable = 'F' THEN
                        fieldFixAmount := var_r.fieldFixAmount;
					ELSE
						select SUM(ts.fieldFixAmount) as sumAmount from temp_structure as ts WHERE ts.salaryFieldId IN (SELECT salaryFieldsEffect from public.MS_fun_salaryFieldChildList(
							company_master_id, 
							var_r.salaryFieldID
						)) INTO sum_effective_value;
						IF var_r.salaryFieldRound = 'Y' THEN
 	                    	SELECT ROUND(sum_effective_value *  var_r.fieldDefaultPer / 100) INTO child_effective_amount;
						ELSE
 	                    	SELECT ROUND(sum_effective_value *  var_r.fieldDefaultPer / 100, var_r.salaryFieldRoundNo) INTO child_effective_amount;
						END IF;
						
						IF var_r.payheadMasterId = 4 AND child_effective_amount > var_r.salaryFieldMaxRange THEN
  	                    	fieldFixAmount := var_r.salaryFieldMaxRange;
						ELSIF var_r.payheadMasterId in (13,14) AND sum_effective_value > var_r.salaryFieldMaxRange THEN
  	                    	fieldFixAmount := 0;
						ELSE
							fieldFixAmount := child_effective_amount;
						END IF;
						
					END IF;
                    gradeName := var_r.gradeName ;
                    gradeFrom := var_r.gradeFrom ;
                    gradeTo := var_r.gradeTo ;
                    gradeSalaryStructureID := var_r.gradeSalaryStructureID ;
                    salaryFieldID := var_r.salaryFieldID ;
                    gradeStructureID := var_r.gradeStructureID ;
                    payheadMasterId := var_r.payheadMasterId ;
                    salaryFieldRound := var_r.salaryFieldRound ;
                    salaryFieldRoundNo := var_r.salaryFieldRoundNo ;
                    salaryFieldIndex := var_r.salaryFieldIndex ;
                    salaryFieldSide := var_r.salaryFieldSide ;
                    salaryFieldSrNo := var_r.salaryFieldSrNo ;
                    salaryFieldFixVariable := var_r.salaryFieldFixVariable ;
                    INSERT INTO temp_structure VALUES (payheadName, fieldDefaultPer, fieldFixAmount,
													  gradeName, gradeFrom, gradeTo, gradeSalaryStructureID,
													  salaryFieldID, gradeStructureID, payheadMasterId,
													  salaryFieldRound, salaryFieldRoundNo,salaryFieldIndex,salaryFieldSide,salaryFieldSrNo,salaryFieldFixVariable,sum_effective_value
                                                      ,child_effective_amount);
                END LOOP;
				RETURN QUERY select * from temp_structure Order by salaryFieldIndex,
                salaryFieldSide;
            END; $$ 
            LANGUAGE 'plpgsql';
        `,
  },
  {
    title: 'getSalaryStructure',
    name: 'MS_fun_getSalaryStructure',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_getsalarystructure(integer, integer, integer);
        CREATE OR REPLACE FUNCTION MS_fun_getSalaryStructure (
            grade_structure_id INT,
            company_master_id INT,
            ctc int
        )
            RETURNS TABLE (
                payheadName VARCHAR,
                fieldDefaultPer float,
                fieldFixAmount float,
                gradeName VARCHAR,
                gradeFrom INT,
                gradeTo INT,
                gradeSalaryStructureID INT,
                salaryFieldID INT,
                gradeStructureID INT,
                payheadMasterId INT,
                salaryFieldRound VARCHAR,
                salaryFieldRoundNo INT,
                salaryFieldIndex INT,
                salaryFieldSide VARCHAR,
                salaryFieldSrNo VARCHAR,
                salaryFieldFixVariable VARCHAR,
                sum_effective_value float,
				child_effective_amount float
            ) AS $$
            DECLARE 
                var_r record;
				sum_effective_value float;
				child_effective_amount float;
				payheadName VARCHAR;
                fieldDefaultPer float;
                fieldFixAmount float;
                gradeName VARCHAR;
                gradeFrom INT;
                gradeTo INT;
                gradeSalaryStructureID INT;
                salaryFieldID INT;
                gradeStructureID INT;
                payheadMasterId INT;
                salaryFieldRound VARCHAR;
                salaryFieldRoundNo INT;
                salaryFieldIndex INT;
                salaryFieldSide VARCHAR;
                salaryFieldSrNo VARCHAR;
                salaryFieldFixVariable VARCHAR;
            BEGIN
				drop table if exists temp_structure;
					create temp table temp_structure (
						payheadName VARCHAR,
						fieldDefaultPer float,
						fieldFixAmount float,
						gradeName VARCHAR,
						gradeFrom INT,
						gradeTo INT,
						gradeSalaryStructureID INT,
						salaryFieldID INT,
						gradeStructureID INT,
						payheadMasterId INT,
						salaryFieldRound VARCHAR,
						salaryFieldRoundNo INT,
                        salaryFieldIndex INT,
                        salaryFieldSide VARCHAR,
                        salaryFieldSrNo VARCHAR,
                        salaryFieldFixVariable VARCHAR,
                        sum_effective_value float,
				        child_effective_amount float
				);
                FOR var_r IN(
                    Select Phm."payheadName" as payheadName,
                    coalesce(Gss."fieldDefaultPer", 0) as fieldDefaultPer,
                    coalesce(Gss."fieldFixAmount", 0) as fieldFixAmount,
                    Gs."gradeName" as gradeName,
                    Gs."gradeFrom" as gradeFrom,
                    Gs."gradeTo" as gradeTo,
                    Gss."gradeSalaryStructureID" as gradeSalaryStructureID,
                    Sf."salaryFieldID" as salaryFieldID,
                    Gs."gradeStructureID" as gradeStructureID,
                    Sf."payheadMasterId" as payheadMasterId,
                    Sf."salaryFieldRound" as salaryFieldRound,
                    Sf."salaryFieldRoundNo" as salaryFieldRoundNo,
					Sf."salaryFieldMaxRange" as salaryFieldMaxRange,
                    Sf."salaryFieldIndex" as salaryFieldIndex,
                    Sf."salaryFieldSide" as salaryFieldSide,
                    Sf."salaryFieldSrNo" as salaryFieldSrNo,
                    Sf."salaryFieldFixVariable" as salaryFieldFixVariable
                From "gradeStructures" As Gs
                Inner join "gradeSalaryStructures" As Gss On Gs."gradeStructureID" = Gss."gradeStructureID"
                Inner join "hrSalaryFields" As Sf On Gss."salaryFieldID" = Sf."salaryFieldID"
                Inner join "Payheadmasters" As Phm On Sf."payheadMasterId" = Phm."payheadMasterId"
                Where Gs."status" = 1
                    And Sf."salaryFieldInactiveDate" Isnull
                    And Sf."salaryFieldShowInCTC" = 'Y'
                    And Gs."gradeStructureID" = grade_structure_id
                    And Gs."companyMasterID" = company_master_id
                Order by Sf."salaryFieldIndex",
                    Sf."salaryFieldSide"
                    )  
                LOOP
                    payheadName := upper(var_r.payheadName) ;
                    fieldDefaultPer := var_r.fieldDefaultPer ;
					IF var_r.payheadMasterId = 2 AND var_r.fieldDefaultPer != 0 THEN
	                    fieldFixAmount := (ctc*var_r.fieldDefaultPer)/100 ;
					ELSIF var_r.payheadMasterId = 3 AND var_r.fieldDefaultPer != 0 THEN
	                    fieldFixAmount := (ctc*var_r.fieldDefaultPer)/100 ;
                    ELSIF var_r.salaryFieldFixVariable = 'F' THEN
                        fieldFixAmount := var_r.fieldFixAmount;
					ELSE
						select SUM(ts.fieldFixAmount) as sumAmount from temp_structure as ts WHERE ts.salaryFieldId IN (SELECT salaryFieldsEffect from public.MS_fun_salaryFieldChildList(
							company_master_id, 
							var_r.salaryFieldID
						)) INTO sum_effective_value;
						IF var_r.salaryFieldRound = 'Y' THEN
 	                    	SELECT ROUND(sum_effective_value *  var_r.fieldDefaultPer / 100) INTO child_effective_amount;
						ELSE
 	                    	SELECT ROUND(sum_effective_value *  var_r.fieldDefaultPer / 100, var_r.salaryFieldRoundNo) INTO child_effective_amount;
						END IF;
						
						IF var_r.payheadMasterId = 4 AND child_effective_amount > var_r.salaryFieldMaxRange THEN
  	                    	fieldFixAmount := var_r.salaryFieldMaxRange;
						ELSIF var_r.payheadMasterId in (13,14) AND sum_effective_value > var_r.salaryFieldMaxRange THEN
  	                    	fieldFixAmount := 0;
						ELSE
							fieldFixAmount := child_effective_amount;
						END IF;
						
					END IF;
                    gradeName := var_r.gradeName ;
                    gradeFrom := var_r.gradeFrom ;
                    gradeTo := var_r.gradeTo ;
                    gradeSalaryStructureID := var_r.gradeSalaryStructureID ;
                    salaryFieldID := var_r.salaryFieldID ;
                    gradeStructureID := var_r.gradeStructureID ;
                    payheadMasterId := var_r.payheadMasterId ;
                    salaryFieldRound := var_r.salaryFieldRound ;
                    salaryFieldRoundNo := var_r.salaryFieldRoundNo ;
                    salaryFieldIndex := var_r.salaryFieldIndex ;
                    salaryFieldSide := var_r.salaryFieldSide ;
                    salaryFieldSrNo := var_r.salaryFieldSrNo ;
                    salaryFieldFixVariable := var_r.salaryFieldFixVariable ;
                    INSERT INTO temp_structure VALUES (payheadName, fieldDefaultPer, fieldFixAmount,
													  gradeName, gradeFrom, gradeTo, gradeSalaryStructureID,
													  salaryFieldID, gradeStructureID, payheadMasterId,
													  salaryFieldRound, salaryFieldRoundNo,salaryFieldIndex,salaryFieldSide,salaryFieldSrNo,salaryFieldFixVariable,sum_effective_value
                                                      ,child_effective_amount);
                END LOOP;
				RETURN QUERY select * from temp_structure Order by salaryFieldIndex,
                salaryFieldSide;
            END; $$ 
            LANGUAGE 'plpgsql';
        `,
  },
  {
    title: 'salaryFieldChildList',
    name: 'MS_fun_salaryFieldChildList',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_salaryfieldchildlist(integer, integer);
        CREATE OR REPLACE FUNCTION MS_fun_salaryFieldChildList(
            COMPANY_MASTER_ID INT, 
            SALARY_FIELD_ID INT
            ) RETURNS TABLE (
                SALARYFIELDSIDE VARCHAR, 
                SALARYFIELDACTIVE VARCHAR, 
                SALARY_FIELD_NAME VARCHAR, 
                SALARY_CHILD_FIELD VARCHAR, 
                SALARYFIELDID INT, 
                SALARYFIELDSEFFECT INT, 
                COMPANYMASTERID INT) AS $$
            BEGIN
      			RETURN QUERY
                Select   SF."salaryFieldSide", SF."salaryFieldActive",phm."payheadName" as VV_SALARY_FIELD_NAME,
                phm1."payheadName" AS VV_SALARY_CHILD_FIELD
                ,SFC."salaryFieldID",SFC."salaryFieldsEffect",
                SF."companyMasterID"
                from "hrSalaryFieldChildren" as SFC inner join "hrSalaryFields" as SF on SFC."salaryFieldID"=SF."salaryFieldID"
                inner join "Payheadmasters" as phm on SF."payheadMasterId"=phm."payheadMasterId"
                inner join "hrSalaryFields" as SF_1 on  SFC."salaryFieldsEffect"=SF_1."salaryFieldID"
                inner join "Payheadmasters" as phm1 on SF_1."payheadMasterId"=phm1."payheadMasterId"
                WHERE SF."companyMasterID"=company_master_id AND SFC."salaryFieldID"=salary_field_id;
            END;
            $$ LANGUAGE 'plpgsql';
        `,
  },
  {
    title: 'gradeList',
    name: 'MS_fun_gradeList',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_gradelist(integer, double precision);
        CREATE OR REPLACE FUNCTION MS_fun_gradeList (
            CmpId INT,
            CTC float
        )
            RETURNS TABLE (
                gsid INT,
                gsName varchar,
                CalcOn varchar
            ) 
            LANGUAGE plpgsql AS 
            $func$
            BEGIN
            RETURN QUERY
            select "gradeStructureID","gradeName","baseOnCalculation" 
            from "gradeStructures" 
            WHERE "status"= 1 AND "companyMasterID"= CmpId AND "gradeFrom" <= CTC and "gradeTo" >= CTC;
            END;
            $func$;
        `,
  },
  {
    title: 'GetSalaryMaster',
    name: 'MS_Fun_GetSalaryMaster',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_getsalarymaster(integer);
        CREATE OR REPLACE FUNCTION public.ms_fun_getsalarymaster(
            uid integer)
            RETURNS TABLE(gradestructureid integer, gradename character varying, payheadname character varying, salarymasterid bigint, usermasterid bigint, gradesalarystructureid bigint, fielddefaultper double precision, fieldfixamount double precision, salaryfromyyyymm integer, salaryfieldside character varying, salaryfieldindex integer,salaryFieldSrNo varchar) 
            LANGUAGE 'plpgsql'
            COST 100
            VOLATILE PARALLEL UNSAFE
            ROWS 1000
        
        AS $BODY$
                  BEGIN
                    RETURN QUERY
                      
                  SELECT  gs."gradeStructureID",gs."gradeName", PHM."payheadName",HSM."salaryMasterID",HSM."userMasterID",HSM."gradeSalaryStructureID",HSM."EmployeeSalaryPer" as per,HSM."EmployeeSalaryAmount" as amount,HSM."salaryFromYYYYMM",HSF."salaryFieldSide",HSF."salaryFieldIndex",HSF."salaryFieldSrNo"
                  FROM    
                  (SELECT     HR_S_Master.*
                   
                                         FROM  
                                              (select max("salaryFromYYYYMM") as salaryFromYYYYMM,"userMasterID" from "hrSalaryMasters"
                                                  where "status"<>2 and  "userMasterID"=uid group by "userMasterID") AS A 
                                                   INNER JOIN "hrSalaryMasters" AS HR_S_Master ON 
                                                   A."userMasterID" = HR_S_Master."userMasterID" AND A.salaryFromYYYYMM = HR_S_Master."salaryFromYYYYMM") AS HSM 
                                                  INNER JOIN "gradeSalaryStructures" as gss on HSM."gradeSalaryStructureID"=gss."gradeSalaryStructureID"
                                                  INNER JOIN 	"hrSalaryFields"  AS HSF ON gss."salaryFieldID"=HSF."salaryFieldID" 
                                                  inner join	"Payheadmasters" as PHM on HSF."payheadMasterId"=PHM."payheadMasterId"
                                                  INNER JOIN    "gradeStructures" AS gs ON gss."gradeStructureID"=gs."gradeStructureID"
                                                  where HSM."userMasterID"=uid
                  ORDER BY HSM."salaryFromYYYYMM",HSM."userMasterID",HSF."salaryFieldSide" DESC,HSF."salaryFieldIndex";
                  END;      
        $BODY$;
          `,
  },
  {
    title: 'GetLeaveTypes',
    name: 'MS_Fun_GetLeaveTypes',
    definition: `
        DROP FUNCTION IF EXISTS public.MS_Fun_GetLeaveTypes(integer);
        CREATE OR REPLACE FUNCTION public.MS_Fun_GetLeaveTypes(
            cmdid integer)
            RETURNS TABLE(leavename character varying, leavedesc character varying,LeaveTranid integer,SortIndex integer,
                 allow_on_h character varying, 
                companymasterid integer,Leave_Allow varchar,Leave_CF varchar, 
                leave_elegibility_days integer, leave_max_days integer,leave_per_days double precision,LeaveID integer) 
            LANGUAGE 'plpgsql'
            COST 100
            VOLATILE PARALLEL UNSAFE
            ROWS 1000
        
        AS $BODY$
                  BEGIN
                    RETURN QUERY
                      
                  
                    select LM."LeaveName",LM."LeaveDesc",
                    LT."LeaveTranId", LT."SortIndex",LT."Allow_On_H",
                    LT."companyMasterID",LT."Leave_Allow",LT."Leave_CF",
                    LT."Leave_Elegibility_Days",LT."Leave_Max_Days",LT."Leave_per_Days",LT."LeaveID"
                    from "hrLeaveTypes" as LT inner join "hrLeaveMasters" as LM on LT."LeaveID"=LM."LeaveID"
                    
                    where LM."status"=1 and LT."status"=1 and LT."companyMasterID"=cmdid
                    Order by LT."SortIndex"; 
                    END;       
        $BODY$;
          `,
  },
  {
    title: 'GetLeavesName',
    name: 'ms_fun_leaves_name',
    definition: `
           DROP FUNCTION IF EXISTS public.ms_fun_leaves_name(integer);
              CREATE OR REPLACE FUNCTION public.ms_fun_leaves_name(comapnymaster_id integer)
                  RETURNS TABLE(leavename character varying, leavedesc character varying, leavetran integer) 
                  LANGUAGE 'plpgsql'                  
         AS $BODY$
                BEGIN
                RETURN QUERY
                select LM."LeaveName" ,LM."LeaveDesc",LD."LeaveTranId"
                from public."hrLeaveTypes" as LD inner join public."hrLeaveMasters" as LM
                on LD."LeaveID"=LM."LeaveID" where LD."Allow_On_H"='Y' and "companyMasterID"=comapnymaster_id;
                END;
            $BODY$;
   `,
  },
  {
    title: 'Leavenameauth',
    name: 'ms_fun_leaves_name_auth',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_leaves_name_auth(integer);

 CREATE OR REPLACE FUNCTION public.ms_fun_leaves_name_auth(comapnymaster_id integer)
                  RETURNS TABLE(leavename character varying, leavedesc character varying, leavetran integer) 
                  LANGUAGE 'plpgsql'                  
         AS $BODY$
                BEGIN
                RETURN QUERY
                 select LM."LeaveName" ,LM."LeaveDesc",LD."LeaveTranId"
                from public."hrLeaveTypes" as LD inner join public."hrLeaveMasters" as LM
                on LD."LeaveID"=LM."LeaveID" where LD."Allow_On_H"='Y' and "companyMasterID"=comapnymaster_id 

UNION ALL
select LM."LeaveName" ,LM."LeaveDesc",LD."LeaveTranId"
                from public."hrLeaveTypes" as LD inner join public."hrLeaveMasters" as LM
                on LD."LeaveID"=LM."LeaveID" where "companyMasterID"=comapnymaster_id and LD."LeaveID"=5;
                END;
            $BODY$;
 `,
  },

  {
    title: 'GetFinYears',
    name: 'MS_Fun_GetFinYears',
    definition: `
        DROP FUNCTION IF EXISTS public.MS_Fun_GetFinYears();
        CREATE OR REPLACE FUNCTION MS_Fun_GetFinYears(
            
            ) RETURNS TABLE (                
                Fin float)
                 AS $$
				DECLARE 
				loop_var INT;
            BEGIN
      			
                FOR loop_var IN 1..12 LOOP             
				RETURN QUERY	SELECT (date_part('year', now()))*100+loop_var;
   				 END LOOP;
	
            END;
            $$ LANGUAGE 'plpgsql';
        
        `,
  },
  {
    title: 'getHrLeaveMonthlyTrans',
    name: 'ms_fun_getHrLeaveMonthlyTrans',
    definition: ` 

                DROP FUNCTION IF EXISTS public.ms_fun_getHrLeaveMonthlyTrans(integer, integer, integer);

                CREATE OR REPLACE FUNCTION public.ms_fun_gethrleavemonthlytrans(
                    cmid integer,
                    finyear integer,
                    uid integer)
                   -- RETURNS TABLE(leavename character varying, leavedesc character varying, leaveid integer, companyid integer, allowonh character varying, leaveallow character varying, allowfieldentry character varying, attntranid bigint, usermasterid bigint, leavetranid bigint, attnyearmon integer, monworkdays integer, attnval integer, mondays integer,TotalLeaveDays float,fromDate date,ToDate date) 
                   RETURNS TABLE(leavename character varying, leavedesc character varying, leaveid integer, companyid integer, allowonh character varying, leaveallow character varying, allowfieldentry character varying, attntranid bigint, usermasterid bigint, leavetranid bigint, attnyearmon integer, monworkdays integer, attnval integer, mondays integer, employeename character varying, totalleavedays double precision, fromdate date, todate date,salaryCalcAct varchar,AttCalc int) 
   
                   LANGUAGE 'plpgsql'                  
                
                AS $BODY$
                                        DECLARE 
                                            var_r record;
                                            AttnTranID Bigint;
                                            UserMasterID bigINT;
                                            LeaveTranID Bigint;
                                            attnyearmon INT;
                                            monworkdays INT;
                                            AttnVal int;
                                            MonDays int;
                                            fdate date;
                                            tdate date;
                                            fyear varchar;
                                            salaryCalcAct varchar;
							                joinDate date;
							                AttCalc float;
                                        BEGIN
                                            drop table if exists temp_structure;
                                                create temp table temp_structure (
                                                    leavename VARCHAR,
                                                    leavedesc VARCHAR,
                                                    leaveid INT,
                                                    companyID int,
                                                    allowOnH varchar,
                                                    leaveallow varchar,
                        
                                                    allowfieldentry varchar,
                                                    AttnTranID Bigint,
                                                    UserMasterID bigINT,
                                                    LeaveTranID Bigint,
                                                    attnyearmon INT,
                                                    monworkdays INT,
                                                    AttnVal int,
                                                    MonDays int,
                                                    TotalLeaveDays float,
                                                    fromdate date,
                                                    todate date,
                                                    salaryCalcAct varchar,
                                                    AttCalc int
                                            );
                                            
                                            fyear=CAST ( finyear AS varchar );
                                            SELECT (date_trunc('MONTH', (fyear||'01')::date) + INTERVAL '1 MONTH - 1 day')::DATE  INTO tdate;
                
                                            SELECT (date_trunc('MONTH', (fyear||'01')::date) + INTERVAL '0 MONTH - 0 day')::DATE  INTO fdate;
                                            
                                            FOR var_r IN(
                                                --select * from MS_Fun_GetLeaveTypes(CMID)
                                                select  UM."displayName" as EmpName,UM."userMasterID" as userMasterID ,LM."LeaveName" as leavename,LM."LeaveDesc" as leavedesc,
                                                LT."LeaveTranId" as leavetranid, LT."SortIndex",LT."Allow_On_H" as allow_on_h,
                                                 LT."companyMasterID" as companymasterid,LT."Leave_Allow" as leave_allow,LT."Leave_CF",
                                                LT."Leave_Elegibility_Days",LT."Leave_Max_Days",LT."Leave_per_Days",LT."LeaveID" as leaveid 
                                                ,coalesce(EJD."salaryCalculationAct",'S') as salaryCalculationAct,coalesce(EJD."joiningDate",'1888-01-01') as joiningDate
                                                from "userMasters" as UM Inner Join 
                                                "hrLeaveTypes" as LT on UM."companyMasterId"=LT."companyMasterID" inner join "hrLeaveMasters" as LM on LT."LeaveID"=LM."LeaveID"
                                                Left Outer Join "employeeJoiningDetails" as EJD on UM."userMasterID"=EJD."userMasterID"
                                                where LM."status"=1 and LT."status"=1 and UM."status"=1 and LT."companyMasterID"=cmid and UM."userMasterID"=uid
                                                Order by LT."SortIndex"
                                                )  
                                            LOOP


                                            salaryCalcAct := upper(var_r.salaryCalculationAct);
							
						                	joinDate :=var_r.joiningDate;

                                            --select ts."AttnTranId"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO AttnTranID;
                                            
                                            --select ts."AttnVal"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO AttnVal;
                                            
                                            select coalesce(ts."AttnTranId",0) as AttnTranId  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO AttnTranID;
							
                                            select coalesce(ts."AttnVal",0) as AttnVal  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO AttnVal;
                            
                                            
                                            IF AttnVal=0 or AttnVal is null THEN
                                            
                                                if var_r.leave_allow = 'Y' and var_r.leaveid NOT IN(1,4,7,9) THEN 						
                                                    select totday into AttnVal from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,uid) ;
                                                    
                                                ELSIF var_r.leave_allow = 'N' and var_r.leaveid =1 THEN
                                                     select * into AttnVal from  public.ms_fun_getDayWise_attendancecalc(var_r.userMasterID,fdate,tdate); 
                                                ELSIF var_r.leaveid =7 THEN
                                                    SELECT  coalesce(sum(value), 0) into AttnVal FROM public."weekoffHolidayTrans" WHERE "userMasterID"=UID and "yearMonth"=finyear and "tableName"='weekoff' and date>joinDate;												
                                                ELSIF var_r.leaveid =9 THEN
                                                    SELECT  coalesce(sum(value), 0) into AttnVal FROM public."weekoffHolidayTrans" WHERE "userMasterID"=UID and "yearMonth"=finyear and "tableName"='holiday' and date>joinDate AND ("optionalHoliday" IS FALSE OR  "optionalHoliday" IS null);								
                                                ELSE
                                                    AttnVal=0;
                                                end if;
                                            
                                            END IF;
                                            
                                            select ts."AttnYearMon"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO attnyearmon;
                                            -- select ts."MonDays"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO MonDays;
                                            select ts."MonWorkDays"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=UID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId INTO monworkdays;
                                            leavename := upper(var_r.leavename) ;
                                            leavedesc := upper(var_r.leavedesc) ;
                                            leaveid:=var_r.leaveid;
                                            companyID:= var_r.companymasterid;
                                            allowOnH:=var_r.allow_on_h;
                                            leaveallow:= var_r.leave_allow;
                                            
                                         
                                            LeaveTranID:= var_r.leavetranid;
                                            select totday into TotalLeaveDays from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,uid) ;
                                            select sDate into fromdate from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,uid) ;
                                            select eDate into todate from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,uid) ;
                                              
                                            IF MonDays IS NULL THEN							
							                     SELECT substring(to_char((date_trunc('MONTH', (fyear||'01')::date) + INTERVAL '1 MONTH - 1 day')::date,'YYYYmmDD'::text),7) INTO MonDays;
                                            END IF;  
							
						                	IF monworkdays IS NULL THEN							
							                    monworkdays:=26;
                                            END IF; 

                                            select coalesce(SUM(ts.AttnVal),0) as sumAmount from temp_structure as ts WHERE  ts.UserID=var_r.userMasterID and ts.leaveid NOT IN(5) into AttCalc;
													
							
							                IF var_r.leaveid =5 AND salaryCalcAct='S' THEN
                                                AttnVal=(MonDays-AttCalc);	
							                ELSIF var_r.leaveid =5 AND salaryCalcAct='F' THEN
								                AttnVal=(monworkdays-AttCalc)-(SELECT  coalesce(sum(value), 0) FROM public."weekoffHolidayTrans" WHERE "userMasterID"=var_r.userMasterID and "yearMonth"=finyear and "tableName"='weekoff');
                                            ELSE 
                                 
                                            end if; 


                                                INSERT INTO temp_structure VALUES (leavename,
                                                    leavedesc ,
                                                    leaveid ,
                                                    CMID ,
                                                    allowOnH ,
                                                    leaveallow ,
                                                    
                                                    allowfieldentry ,
                                                    AttnTranID ,
                                                    UID ,
                                                    LeaveTranID ,
                                                    Finyear ,
                                                    monworkdays ,
                                                    AttnVal ,
                                                    MonDays ,
                                                    TotalLeaveDays,
                                                    fromdate,todate,salaryCalcAct,AttCalc
                                                                                   
                                                    );
                                            END LOOP;
                                            
                                            
                                            
                                            RETURN QUERY select * from temp_structure Order by leaveid;
                                        END; 
                            
                $BODY$;
                


        `,
  },
  {
    title: 'getHrLeaveMonthlyTrans',
    name: 'ms_fun_getHrLeaveMonthlyTrans',
    definition: ` 

                DROP FUNCTION IF EXISTS public.ms_fun_gethrleavemonthlytrans(integer, integer);

                                        
                        CREATE OR REPLACE FUNCTION public.ms_fun_gethrleavemonthlytrans(
                            cmid integer,
                            finyear integer)
                            RETURNS TABLE(leavename character varying, leavedesc character varying, leaveid integer, companyid integer, allowonh character varying, leaveallow character varying, allowfieldentry character varying, attntranid bigint, usermasterid bigint, leavetranid bigint, attnyearmon integer, monworkdays integer, attnval integer, mondays integer, employeename character varying, totalleavedays double precision, fromdate date, todate date, salarycalcact character varying, attcalc integer) 
                            LANGUAGE 'plpgsql'
                            COST 100
                            VOLATILE PARALLEL UNSAFE
                            ROWS 1000

                        AS $BODY$
                                            DECLARE 
                                            var_r record;
                                            AttnTranID Bigint;
                                            UserIDd bigINT;
                                            LeaveTranID Bigint;
                                            attnyearmon INT;
                                            monworkdays INT;
                                            AttnVal int;
                                            MonDays int;
                                            EmployeeName varchar;
                                            fdate date;
                                            tdate date;
                                            fyear varchar;
                                            salaryCalcAct varchar;
                                            joinDate date;
                                            AttCalc float;
                                        BEGIN
                                            drop table if exists temp_structure;
                                                create temp table temp_structure (
                                                    leavename VARCHAR,
                                                    leavedesc VARCHAR,
                                                    leaveid INT,
                                                    companyID int,
                                                    allowOnH varchar,
                                                    leaveallow varchar,
                                            
                                                    allowfieldentry varchar,
                                                    AttnTranID Bigint,
                                                    UserID bigINT,
                                                    LeaveTranID Bigint,
                                                    attnyearmon INT,
                                                    monworkdays INT,
                                                    AttnVal int,
                                                    MonDays int,
                                                    EmployeeName varchar,
                                                    TotalLeaveDays float,
                                                    fromdate date,
                                                    todate date,
                                                    salaryCalcAct varchar,
                                                    AttCalc int
                                            );
                                            
                                            fyear=CAST ( finyear AS varchar );
                                            SELECT (date_trunc('MONTH', (fyear||'01')::date) + INTERVAL '1 MONTH - 1 day')::DATE  INTO tdate;
                                
                                            SELECT (date_trunc('MONTH', (fyear||'01')::date) + INTERVAL '0 MONTH - 0 day')::DATE  INTO fdate;
                                                            
                                            FOR var_r IN(
                                                select  UM."displayName" as EmpName,UM."userMasterID" as userMasterID ,LM."LeaveName" as leavename,LM."LeaveDesc" as leavedesc,
                                                LT."LeaveTranId" as leavetranid, LT."SortIndex",LT."Allow_On_H" as allow_on_h,
                                                LT."companyMasterID" as companymasterid,LT."Leave_Allow" as leave_allow,LT."Leave_CF",
                                                LT."Leave_Elegibility_Days",LT."Leave_Max_Days",LT."Leave_per_Days",LT."LeaveID" as leaveid 
                                                ,coalesce(EJD."salaryCalculationAct",'S') as salaryCalculationAct,coalesce(EJD."joiningDate",'1888-01-01') as joiningDate
                                                from "userMasters" as UM Inner Join 
                                                "hrLeaveTypes" as LT on UM."companyMasterId"=LT."companyMasterID" inner join "hrLeaveMasters" as LM on LT."LeaveID"=LM."LeaveID"
                                                Left Outer Join "employeeJoiningDetails" as EJD on UM."userMasterID"=EJD."userMasterID"
                                                where LT."status"=1 and UM."status"=1 and LT."companyMasterID"=cmid
                                                Order by LT."SortIndex"
                                                )  
                                            LOOP
                                            
                                            salaryCalcAct := upper(var_r.salaryCalculationAct);
                                            
                                            joinDate :=var_r.joiningDate;							
                                            
                                            
                                            select coalesce(ts."AttnTranId",0) as AttnTranId  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=var_r.userMasterID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO AttnTranID;
                                            
                                            select coalesce(ts."AttnVal",0) as AttnVal  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=var_r.userMasterID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO AttnVal;
                                            
                                            IF AttnVal=0 or AttnVal is null THEN
                                                            
                                                    if var_r.leave_allow = 'Y' and var_r.leaveid NOT IN(1,4,7,9) THEN 						
                                                            select totday into AttnVal from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,var_r.userMasterID) ;                                                    
                                                    ELSIF var_r.leave_allow = 'N' and var_r.leaveid =1 THEN
															select * into AttnVal from  public.ms_fun_getDayWise_attendancecalc(var_r.userMasterID,fdate,tdate);                                                            	
                                                    ELSIF var_r.leaveid =7 THEN                                           
                                                            SELECT  coalesce(sum(value), 0) into AttnVal FROM public."weekoffHolidayTrans" WHERE "userMasterID"=var_r.userMasterID and "yearMonth"=finyear and "tableName"='weekoff' and date>joinDate;											
                                                    ELSIF var_r.leaveid =9 THEN
                                                        SELECT  coalesce(sum(value), 0) into AttnVal FROM public."weekoffHolidayTrans" WHERE "userMasterID"=var_r.userMasterID and "yearMonth"=finyear and "tableName"='holiday' and date>joinDate AND ("optionalHoliday" IS FALSE OR  "optionalHoliday" IS null);							
                                                    ELSE
                                                        AttnVal=0;
                                                    end if;
                                            
                                            END IF;
                                            
                                            
                                            select ts."AttnYearMon"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=var_r.userMasterID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO attnyearmon;
                                            select ts."MonDays"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=var_r.userMasterID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId  INTO MonDays;
                                            select ts."MonWorkDays"  from "hrLeaveMonthlyTrans" as ts WHERE ts."userMasterID"=var_r.userMasterID and ts."AttnYearMon"=Finyear and ts."LeaveTranId"=var_r.LeaveTranId INTO monworkdays;
                                            leavename := upper(var_r.leavename) ;
                                            leavedesc := upper(var_r.leavedesc) ;
                                            EmployeeName:=upper(var_r.EmpName);
                                            leaveid:=var_r.leaveid;
                                            companyID:= var_r.companymasterid;
                                            allowOnH:=var_r.allow_on_h;
                                            leaveallow:= var_r.leave_allow;
                                        
                                         
                                            LeaveTranID:= var_r.leavetranid;
                                            UserIDd:=var_r.userMasterID;
                                            select totday into TotalLeaveDays from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,UserIDd) ;
                                            select sDate into fromdate from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,UserIDd) ;
                                            select eDate into todate from ms_fun_leaves_AttnSum(fdate,tdate,var_r.leavetranid,UserIDd) ;
                                            
                                            IF MonDays IS NULL THEN							
                                            SELECT substring(to_char((date_trunc('MONTH', (fyear||'01')::date) + INTERVAL '1 MONTH - 1 day')::date,'YYYYmmDD'::text),7) INTO MonDays;
                                            END IF;  
                                            
                                            IF monworkdays IS NULL THEN							
                                            monworkdays:=26;
                                            END IF;  
                                            
                                            select coalesce(SUM(ts.AttnVal),0) as sumAmount from temp_structure as ts WHERE  ts.UserID=var_r.userMasterID and ts.leaveid NOT IN(5) into AttCalc;
                                                                    
                                            
                                            IF var_r.leaveid =5 AND salaryCalcAct='S' THEN
                                                AttnVal=(MonDays-AttCalc);	
                                            ELSIF var_r.leaveid =5 AND salaryCalcAct='F' THEN
                                                AttnVal=(monworkdays-AttCalc)-(SELECT  coalesce(sum(value), 0) FROM public."weekoffHolidayTrans" WHERE "userMasterID"=var_r.userMasterID and "yearMonth"=finyear and "tableName"='weekoff');
                                            ELSE 
                                                
                                            end if; 

                                                INSERT INTO temp_structure VALUES (leavename,
                                                    leavedesc ,
                                                    leaveid ,
                                                    CMID ,
                                                    allowOnH ,
                                                    leaveallow ,
                                                
                                                    allowfieldentry ,
                                                    AttnTranID ,
                                                    UserIDd ,
                                                    LeaveTranID ,
                                                    Finyear ,
                                                    monworkdays ,
                                                    AttnVal ,
                                                    MonDays,
                                                EmployeeName, 
                                                TotalLeaveDays,
                                                fromdate,todate,salaryCalcAct,AttCalc);
                                            END LOOP;
                                            RETURN QUERY select * from temp_structure Order by UserID, leaveid;
                                        END; 
                            
                
                $BODY$;
                
        `,
  },
  {
    title: 'GetLeavesAttnSum',
    name: 'ms_fun_leaves_attnsum',
    definition: ` 

                 DROP FUNCTION IF EXISTS public.ms_fun_leaves_attnsum(date, date, bigint, bigint);

               
                    CREATE OR REPLACE FUNCTION public.ms_fun_leaves_attnsum(
                        fdate date,
                        tdate date,
                        l_tranid bigint,
                        u_masterid bigint)
                        RETURNS table (totday float,sDate date,eDate date,LTID bigint,UserID bigint)
                        LANGUAGE 'plpgsql'
                        COST 100
                        VOLATILE PARALLEL UNSAFE
                    AS $BODY$
                        declare 
                        totaldays float; 
                        
                        BEGIN
                                    
                            select coalesce(sum("LeaveDays"), 0) into totaldays from 
                            Public."hrLeaveTypes" as LT inner Join public."userLeaves" as UL
                            on LT."LeaveTranId" = UL."LeaveTranId"
                            where LT."LeaveTranId"=l_tranid and UL."userMasterID"=u_masterid and UL."FromDate">= fdate  and UL."ToDate"<= tdate ;
                            
                            --RETURN totaldays;
                            RETURN QUERY (select totaldays as totday,fdate,tdate,l_tranid,u_masterid);
                        END;
                    
                        
                    $BODY$;


        `,
  },
  {
    title: 'GethrSalaryMasters',
    name: 'MS_fun_GethrSalaryMasters',
    definition: `
        DROP FUNCTION IF EXISTS public.MS_fun_GethrSalaryMasters(Int, Int);

        CREATE OR REPLACE FUNCTION MS_fun_GethrSalaryMasters(
            COMPANY_MASTER_ID INT, 
            YYYYMM INT
            ) RETURNS TABLE (
                EmployeeName VARCHAR, 
                SALARYFIELDNAME VARCHAR, 
                gradeName VARCHAR, 
                baseOnCalculation VARCHAR, 
                salaryFieldAttanChk INT, 
                salaryFieldSide varchar, 
                salaryFieldIndex INT,
				salaryFieldShow varchar,
				salaryFieldSrNo varchar,
				salaryMasterID bigint,
				userMasterID bigint,
				gradeSalaryStructureID bigint,
				EmployeeSalaryAmount float,
				EmployeeSalaryPer float,
				salaryFromYYYYMM int
			
			
			
			
			) AS $$
            BEGIN
      			RETURN QUERY
                
				select UM."displayName", PH."payheadName",GS."gradeName",GS."baseOnCalculation",SF."salaryFieldAttanChk",SF."salaryFieldSide",SF."salaryFieldIndex", 
				SF."salaryFieldShow",SF."salaryFieldSrNo",
				SM."salaryMasterID",SM."userMasterID",SM."gradeSalaryStructureID",SM."EmployeeSalaryAmount",SM."EmployeeSalaryPer"
				,SM."salaryFromYYYYMM" 
				from public."gradeStructures" as GS 
				inner join public."gradeSalaryStructures" as GSS on GS."gradeStructureID"=GSS."gradeStructureID"
				inner join public."hrSalaryFields" as SF on GSS."salaryFieldID" = SF."salaryFieldID"
				Inner Join public."Payheadmasters" as PH on SF."payheadMasterId" = PH."payheadMasterId"
				Inner Join public."hrSalaryMasters" as SM on GSS."gradeSalaryStructureID" = SM."gradeSalaryStructureID"
				Inner join public."userMasters" as UM on SM."userMasterID"=UM."userMasterID"
				where  SF."companyMasterID"=COMPANY_MASTER_ID  and SM."salaryFromYYYYMM"=YYYYMM
				order by SF."salaryFieldIndex";
            END;
            $$ LANGUAGE 'plpgsql';
        
        `,
  },
  //   {
  //     title: 'GethrSalaryCalculation',
  //     name: 'ms_fun_GethrSalaryCalculation',
  //     definition: `

  //         DROP FUNCTION IF EXISTS public.ms_fun_GethrSalaryCalculation(integer, integer);

  //         CREATE OR REPLACE FUNCTION public.ms_fun_gethrsalarycalculation(
  //             cmid integer,
  //             finyear integer)
  //             RETURNS TABLE(employeename character varying, salaryfieldname character varying, gradename character varying, baseoncalculation character varying, salaryfieldattanchk integer, salaryfieldside character varying, salaryfieldindex integer, salaryfieldshow character varying, salaryfieldsrno character varying, salarymasterid bigint, usermasterid integer, gradesalarystructureid bigint, employeesalaryamount double precision, employeesalaryper double precision, salaryfromyyyymm integer, payheadmasterid integer, salaryfieldround character varying, salaryfieldroundno integer, attnval integer, calcuationmonth integer, empcalcusalaryamount double precision, referenceid integer, referencetable character varying)
  //             LANGUAGE 'plpgsql'
  //             COST 100
  //             VOLATILE PARALLEL UNSAFE
  //             ROWS 1000

  //         AS $BODY$
  //                     DECLARE
  //                         var_r record;
  //                         Tattnval int;
  //                         TcalcuationMonth int;
  //                         TEmpCalcuSalaryAmount float;
  //                         TsalaryFromYYYYMM int;
  //                         Tpayheadid int;
  //                         TReferenceId int;
  //                         TRefTableName varchar;
  //                         usersalarytranid int;
  //                         BEGIN
  //                           drop table if exists temp_structure;
  //                           create temp table temp_structure (
  //                                                             EmployeeName VARCHAR,
  //                                                             SALARYFIELDNAME VARCHAR,
  //                                                             gradeName VARCHAR,
  //                                                             baseOnCalculation VARCHAR,
  //                                                               salaryfieldattanchk integer,
  //                                                               salaryfieldside varchar,
  //                                                               salaryfieldindex integer,
  //                                                               salaryfieldshow varchar,
  //                                                               salaryfieldsrno varchar,
  //                                                               salarymasterid bigint,
  //                                                               usermasterid integer,
  //                                                               gradesalarystructureid bigint,
  //                                                               employeesalaryamount double precision,
  //                                                               employeesalaryper double precision,
  //                                                               salaryfromyyyymm integer,
  //                                                               payheadmasterid integer,
  //                                                               salaryfieldround character varying,
  //                                                               salaryfieldroundno integer,
  //                                                               attnval integer,
  //                                                               calcuationmonth integer,
  //                                                               empcalcusalaryamount double precision,
  //                                                               ReferenceID integer,
  //                                                               ReferenceTable varchar

  //                                                               );

  //                         --TcalcuationMonth:=30;
  //                              SELECT substring(to_char((date_trunc('MONTH', (finyear||'01')::date) + INTERVAL '1 MONTH - 1 day')::date,'YYYYmmDD'::text),7) INTO TcalcuationMonth;

  //                         FOR var_r IN(
  //                                         select * from MS_fun_GethrEmployeeSalaryMasters(cmid,finyear)
  //                                     )
  //                         LOOP

  //                         TRefTableName:='';
  //                         TReferenceId:=0;

  //                         select "userSalaryTranID" from public."hrSalaryTrasactions" where "userMasterID"=var_r.usermasterid and "salaryYYYYMM"=finyear and "salaryMasterID"=var_r.salarymasterid INTO usersalarytranid;

  //                         select
  //                         coalesce(sum(TS."AttnVal"),0) INTO Tattnval
  //                         from "hrLeaveTypes" as LT inner join "hrLeaveMasters" as LM on LT."LeaveID"=LM."LeaveID"
  //                         inner join "hrLeaveMonthlyTrans" as TS on TS."LeaveTranId"=LT."LeaveTranId"
  //                         where (LM."status"=1 or LM."status"=0) and  LT."status"=1 and LT."companyMasterID"=cmid and TS."userMasterID"=var_r.usermasterid and TS."AttnYearMon"=finyear
  //                         group by TS."userMasterID";

  //                          IF usersalarytranid=0 or usersalarytranid is null THEN

  //                          IF Tpayheadid=16 THEN
  //                             select "amount" from public."advancePayments" where "userMasterID"=var_r.usermasterid and "paymentYearMonth"=finyear into TEmpCalcuSalaryAmount;

  //                             select "advancePaymentID" from public."advancePayments"  where "userMasterID"=var_r.usermasterid and "paymentYearMonth"=finyear Into TReferenceId;

  //                             TRefTableName:='advancePayments';
  //                         ELSIF Tpayheadid=17 THEN

  //                             select LT."EMIAmount" from public."loanMasters" as LM inner join public."loanTransactions" as LT on
  //                             LM."LoanID"=LT."LoanID"
  //                             where LM."userMasterID"=var_r.usermasterid and LT."EMIMonth"=finyear into TEmpCalcuSalaryAmount;

  //                             select LT."LoanTrasactionId" from public."loanMasters" as LM inner join public."loanTransactions" as LT on
  //                             LM."LoanID"=LT."LoanID"
  //                             where LM."userMasterID"=var_r.usermasterid and LT."EMIMonth"=finyear into TReferenceId;

  //                             TRefTableName:='loanTransactions';

  //                          ELSE
  //                                            IF var_r.salaryfieldattanchk=0 then
  //                                             TEmpCalcuSalaryAmount:=var_r.employeesalaryamount;
  //                                         ELSE
  //                                             TEmpCalcuSalaryAmount:=(var_r.employeesalaryamount/TcalcuationMonth)*Tattnval;
  //                                         END IF;
  //                          END IF;

  //                         IF upper(var_r.salaryfieldround)='Y' THEN
  //                             TEmpCalcuSalaryAmount:= ROUND(TEmpCalcuSalaryAmount);
  //                         ELSE
  //                             TEmpCalcuSalaryAmount:= ROUND(TEmpCalcuSalaryAmount,var_r.salaryfieldroundno);
  //                         END IF;

  //                         ELSE
  //                               TRefTableName:='hrSalaryTrasactions';
  //                                 TReferenceId:=usersalarytranid;
  //                              select "EmployeeSalaryAmount" from public."hrSalaryTrasactions" where "userMasterID"=var_r.usermasterid and "salaryYYYYMM"=finyear and "salaryMasterID"=var_r.salarymasterid INTO TEmpCalcuSalaryAmount;

  //                         END IF;

  //                         INSERT INTO temp_structure VALUES (upper(var_r.EmployeeName),
  //                                                            upper(var_r.SALARYFIELDNAME),
  //                                                            upper(var_r.gradeName) ,
  //                                                            upper(var_r.baseOnCalculation),
  //                                                            var_r.salaryfieldattanchk,
  //                                                            var_r.salaryfieldside,
  //                                                            var_r.salaryfieldindex,
  //                                                            var_r.salaryfieldshow ,
  //                                                              var_r.salaryfieldsrno ,
  //                                                              var_r.salarymasterid,
  //                                                            var_r.usermasterid ,
  //                                                              var_r.gradesalarystructureid ,
  //                                                              var_r.employeesalaryamount,
  //                                                            var_r.employeesalaryper,
  //                                                               finyear,
  //                                                               var_r.payheadmasterid,
  //                                                            var_r.salaryfieldround  ,
  //                                                              var_r.salaryfieldroundno ,
  //                                                               Tattnval,
  //                                                            TcalcuationMonth,
  //                                                            TEmpCalcuSalaryAmount,
  //                                                            TReferenceId,
  //                                                            TRefTableName
  //                                                           );

  //                         END LOOP;
  //                          RETURN QUERY select * from temp_structure ;
  //                         END;

  //         $BODY$;
  //         `,
  //   },
  //   {
  //     title: 'gethrsalarycalculation',
  //     name: 'ms_fun_gethrsalarycalculation',
  //     definition: `
  //             DROP FUNCTION IF EXISTS public.ms_fun_gethrsalarycalculation(integer, integer, integer);
  //             CREATE OR REPLACE FUNCTION public.ms_fun_gethrsalarycalculation(
  //                 cmid integer,
  //                 finyear integer,
  //                 userid integer)
  //                 RETURNS TABLE(employeename character varying, salaryfieldname character varying, gradename character varying, baseoncalculation character varying, salaryfieldattanchk integer, salaryfieldside character varying, salaryfieldindex integer, salaryfieldshow character varying, salaryfieldsrno character varying, salarymasterid bigint, usermasterid integer, gradesalarystructureid bigint, employeesalaryamount double precision, employeesalaryper double precision, salaryfromyyyymm integer, payheadmasterid integer, salaryfieldround character varying, salaryfieldroundno integer, attnval integer, calcuationmonth integer, empcalcusalaryamount double precision, referenceid integer, referencetable character varying)
  //                 LANGUAGE 'plpgsql'
  //                 COST 100
  //                 VOLATILE PARALLEL UNSAFE
  //                 ROWS 1000

  //             AS $BODY$
  //                                     DECLARE
  //                                         var_r record;
  //                                         Tattnval int;
  //                                         TcalcuationMonth int;
  //                                         TEmpCalcuSalaryAmount float;
  //                                         TsalaryFromYYYYMM int;
  //                                         Tpayheadid int;
  //                                         TReferenceId int;
  //                                         TRefTableName varchar;
  //                                         usersalarytranid int;
  //                                         BEGIN
  //                                         drop table if exists temp_structure;
  //                                         create temp table temp_structure (
  //                                                                             EmployeeName VARCHAR,
  //                                                                             SALARYFIELDNAME VARCHAR,
  //                                                                             gradeName VARCHAR,
  //                                                                             baseOnCalculation VARCHAR,
  //                                                                             salaryfieldattanchk integer,
  //                                                                             salaryfieldside varchar,
  //                                                                             salaryfieldindex integer,
  //                                                                             salaryfieldshow varchar,
  //                                                                             salaryfieldsrno varchar,
  //                                                                             salarymasterid bigint,
  //                                                                             usermasterid integer,
  //                                                                             gradesalarystructureid bigint,
  //                                                                             employeesalaryamount double precision,
  //                                                                             employeesalaryper double precision,
  //                                                                             salaryfromyyyymm integer,
  //                                                                             payheadmasterid integer,
  //                                                                             salaryfieldround character varying,
  //                                                                             salaryfieldroundno integer,
  //                                                                             attnval integer,
  //                                                                             calcuationmonth integer,
  //                                                                             empcalcusalaryamount double precision,
  //                                                                             ReferenceID integer,
  //                                                                             ReferenceTable varchar

  //                                                                             );

  //                                         --TcalcuationMonth:=30;
  //                                             SELECT substring(to_char((date_trunc('MONTH', (finyear||'01')::date) + INTERVAL '1 MONTH - 1 day')::date,'YYYYmmDD'::text),7) INTO TcalcuationMonth;

  //                                         FOR var_r IN(
  //                                                         select * from MS_fun_GethrEmployeeSalaryMasters(cmid,finyear,userid)
  //                                                     )
  //                                         LOOP

  //                                         TRefTableName:='';
  //                                         TReferenceId:=0;

  //                                         select "userSalaryTranID" from public."hrSalaryTrasactions" where "userMasterID"=var_r.usermasterid and "salaryYYYYMM"=finyear and "salaryMasterID"=var_r.salarymasterid INTO usersalarytranid;

  //                                         select
  //                                             coalesce(sum(TS."AttnVal"),0) INTO Tattnval
  //                                          from "hrLeaveTypes" as LT inner join "hrLeaveMasters" as LM on LT."LeaveID"=LM."LeaveID"
  //                                             inner join "hrLeaveMonthlyTrans" as TS on TS."LeaveTranId"=LT."LeaveTranId"
  //                                          where (LM."status"=1 or LM."status"=0) and  LT."status"=1 and LT."companyMasterID"=cmid and TS."userMasterID"=var_r.usermasterid and TS."AttnYearMon"=finyear
  //                                             group by TS."userMasterID";

  //                                         IF usersalarytranid=0 or usersalarytranid is null THEN

  //                                         IF Tpayheadid=16 THEN
  //                                             select "amount" from public."advancePayments" where "userMasterID"=var_r.usermasterid and "paymentYearMonth"=finyear into TEmpCalcuSalaryAmount;

  //                                             select "advancePaymentID" from public."advancePayments"  where "userMasterID"=var_r.usermasterid and "paymentYearMonth"=finyear Into TReferenceId;

  //                                             TRefTableName:='advancePayments';
  //                                         ELSIF Tpayheadid=17 THEN

  //                                             select LT."EMIAmount" from public."loanMasters" as LM inner join public."loanTransactions" as LT on
  //                                             LM."LoanID"=LT."LoanID"
  //                                             where LM."userMasterID"=var_r.usermasterid and LT."EMIMonth"=finyear into TEmpCalcuSalaryAmount;

  //                                             select LT."LoanTrasactionId" from public."loanMasters" as LM inner join public."loanTransactions" as LT on
  //                                             LM."LoanID"=LT."LoanID"
  //                                             where LM."userMasterID"=var_r.usermasterid and LT."EMIMonth"=finyear into TReferenceId;

  //                                             TRefTableName:='loanTransactions';

  //                                         ELSE
  //                                             IF var_r.salaryfieldattanchk=0 then
  //                                                 TEmpCalcuSalaryAmount:=var_r.employeesalaryamount;
  //                                             ELSE
  //                                                 TEmpCalcuSalaryAmount:=(var_r.employeesalaryamount/TcalcuationMonth)*Tattnval;
  //                                             END IF;
  //                                         END IF;

  //                                         IF upper(var_r.salaryfieldround)='Y' THEN
  //                                             TEmpCalcuSalaryAmount:= ROUND(TEmpCalcuSalaryAmount);
  //                                         ELSE
  //                                             TEmpCalcuSalaryAmount:= ROUND(TEmpCalcuSalaryAmount,var_r.salaryfieldroundno);
  //                                         END IF;

  //                                         ELSE
  //                                             TRefTableName:='hrSalaryTrasactions';
  //                                                 TReferenceId:=usersalarytranid;
  //                                              select "EmployeeSalaryAmount" from public."hrSalaryTrasactions" where "userMasterID"=var_r.usermasterid and "salaryYYYYMM"=finyear and "salaryMasterID"=var_r.salarymasterid INTO TEmpCalcuSalaryAmount;

  //                                         END IF;

  //                                         INSERT INTO temp_structure VALUES (upper(var_r.EmployeeName),
  //                                                                         upper(var_r.SALARYFIELDNAME),
  //                                                                         upper(var_r.gradeName) ,
  //                                                                         upper(var_r.baseOnCalculation),
  //                                                                         var_r.salaryfieldattanchk,
  //                                                                         var_r.salaryfieldside,
  //                                                                         var_r.salaryfieldindex,
  //                                                                         var_r.salaryfieldshow ,
  //                                                                             var_r.salaryfieldsrno ,
  //                                                                             var_r.salarymasterid,
  //                                                                         var_r.usermasterid ,
  //                                                                             var_r.gradesalarystructureid ,
  //                                                                             var_r.employeesalaryamount,
  //                                                                         var_r.employeesalaryper,
  //                                                                             finyear,
  //                                                                             var_r.payheadmasterid,
  //                                                                         var_r.salaryfieldround  ,
  //                                                                             var_r.salaryfieldroundno ,
  //                                                                             Tattnval,
  //                                                                         TcalcuationMonth,
  //                                                                         TEmpCalcuSalaryAmount,
  //                                                                         TReferenceId,
  //                                                                         TRefTableName
  //                                                                         );

  //                                         END LOOP;
  //                                         RETURN QUERY select * from temp_structure ;
  //                                         END;

  //             $BODY$;

  //         `,
  //   },
  // {
  //     title: 'GethrEmployeeSalaryMasters',
  //     name: 'MS_fun_GethrEmployeeSalaryMasters',
  //     definition: `
  //     Drop FUNCTION MS_fun_GethrEmployeeSalaryMasters(INT,INT);
  //     CREATE OR REPLACE FUNCTION MS_fun_GethrEmployeeSalaryMasters(
  //     cmpid INT,
  //     finyear INT
  //     ) RETURNS TABLE (
  //         EmployeeName VARCHAR,
  //                                 SALARYFIELDNAME VARCHAR,
  //                                 gradeName VARCHAR,
  //                                 baseOnCalculation VARCHAR,
  //                                 salaryFieldAttanChk INT,
  //                                 salaryFieldSide varchar,
  //                                 salaryFieldIndex INT,
  //                                 salaryFieldShow varchar,
  //                                 salaryFieldSrNo varchar,
  //                                 salaryMasterID bigint,
  //                                 userMasterID int,
  //                                 gradeSalaryStructureID bigint,
  //                                 EmployeeSalaryAmount float,
  //                                 EmployeeSalaryPer float,
  //                                 salaryFromYYYYMM int,
  //                                 payheadMasterId int,
  //                                 salaryFieldRound varchar,
  //                                 salaryFieldRoundNo int,
  //                                 attnval int,
  //                                 calcuationMonth int,
  //                                 EmpCalcuSalaryAmount int

  //     ) AS $$
  //     BEGIN
  //           RETURN QUERY

  //         select SMst."empname" as EmployeeName, PH."payheadName" as SALARYFIELDNAME,GS."gradeName" as gradeName,GS."baseOnCalculation" as  baseOnCalculation,SF."salaryFieldAttanChk" as salaryFieldAttanChk,SF."salaryFieldSide" as salaryFieldSide ,SF."salaryFieldIndex" as salaryFieldIndex,
  //                                                 SF."salaryFieldShow" as salaryFieldShow,SF."salaryFieldSrNo" as salaryFieldSrNo,
  //                                                 SMst."salaryMasterID" as salaryMasterID,SMst."userMasterID" as userMasterID,SMst."gradeSalaryStructureID" as gradeSalaryStructureID,SMst."EmployeeSalaryAmount" as EmployeeSalaryAmount,SMst."EmployeeSalaryPer" as EmployeeSalaryPer
  //                                                 ,SMst."salaryFromYYYYMM" as salaryFromYYYYMM,PH."payheadMasterId" as payheadMasterId,SF."salaryFieldRound" as salaryFieldRound,SF."salaryFieldRoundNo"  as salaryFieldRoundNo, 0 as attnval
  //                                                 ,0 as calcuationMonth,0 as EmpCalcuSalaryAmount
  //                                                 from public."gradeStructures" as GS
  //                                                 inner join public."gradeSalaryStructures" as GSS on GS."gradeStructureID"=GSS."gradeStructureID"
  //                                                 inner join public."hrSalaryFields" as SF on GSS."salaryFieldID" = SF."salaryFieldID"
  //                                                 Inner Join public."Payheadmasters" as PH on SF."payheadMasterId" = PH."payheadMasterId"
  //                                                 Inner Join
  //                                                 (SELECT   HSM."salaryMasterID", HSM."EmployeeSalaryAmount",HSM."EmployeeSalaryPer", HSM."gradeSalaryStructureID", B.*
  //                                                             FROM    public."hrSalaryMasters" as HSM JOIN
  //                                                         (SELECT     A."salaryFromYYYYMM", vEmp.*, ROW_NUMBER() OVER (partition BY A."userMasterID"
  //                                                          ORDER BY "salaryFromYYYYMM" DESC) AS VN_Id	FROM
  //                                                          (select distinct SM."userMasterID",SM."salaryFromYYYYMM"
  //                                                             from public."gradeStructures" as GS
  //                                                             inner join public."gradeSalaryStructures" as GSS on GS."gradeStructureID"=GSS."gradeStructureID"
  //                                                             inner join public."hrSalaryFields" as SF on GSS."salaryFieldID" = SF."salaryFieldID"
  //                                                             Inner Join public."Payheadmasters" as PH on SF."payheadMasterId" = PH."payheadMasterId"
  //                                                             Inner Join public."hrSalaryMasters" as SM on GSS."gradeSalaryStructureID" = SM."gradeSalaryStructureID"
  //                                                             Inner join public."userMasters" as UM on SM."userMasterID"=UM."userMasterID"
  //                                                             Left Outer join public."employeeJoiningDetails" as UMJD on UM."userMasterID"=UMJD."userMasterID"
  //                                                             where  UM."status"=1 and "leavingDate" is null and SF."salaryFieldShow"='Y' and SF."companyMasterID"=cmpid  and SM."salaryFromYYYYMM"<=finyear) AS A
  //                                                             INNER JOIN public.ms_view_employeedetails AS vEmp ON A."userMasterID" = vEmp."userMasterID") AS B
  //                                                             ON  HSM."userMasterID" = B."userMasterID" AND HSM."salaryFromYYYYMM"  = B."salaryFromYYYYMM"  AND B.VN_Id = 1 	WHERE  HSM."status"=1) as SMst on GSS."gradeSalaryStructureID" = SMst."gradeSalaryStructureID";
  //     END;
  //     $$ LANGUAGE 'plpgsql';

  //     `,
  // },
  //   {
  //     title: 'GethrEmployeeSalaryMasters',
  //     name: 'MS_fun_GethrEmployeeSalaryMasters',
  //     definition: `
  //         DROP FUNCTION IF EXISTS public.ms_fun_gethremployeesalarymasters(integer, integer, integer);

  //         CREATE OR REPLACE FUNCTION public.ms_fun_gethremployeesalarymasters(
  //             cmpid integer,
  //             finyear integer,
  //             userid integer)
  //             RETURNS TABLE(employeename character varying, salaryfieldname character varying, gradename character varying, baseoncalculation character varying, salaryfieldattanchk integer, salaryfieldside character varying, salaryfieldindex integer, salaryfieldshow character varying, salaryfieldsrno character varying, salarymasterid bigint, usermasterid integer, gradesalarystructureid bigint, employeesalaryamount double precision, employeesalaryper double precision, salaryfromyyyymm integer, payheadmasterid integer, salaryfieldround character varying, salaryfieldroundno integer, attnval integer, calcuationmonth integer, empcalcusalaryamount integer)
  //             LANGUAGE 'plpgsql'
  //             COST 100
  //             VOLATILE PARALLEL UNSAFE
  //             ROWS 1000

  //         AS $BODY$
  //                 BEGIN
  //                       RETURN QUERY

  //                     select SMst."empname" as EmployeeName, PH."payheadName" as SALARYFIELDNAME,GS."gradeName" as gradeName,GS."baseOnCalculation" as  baseOnCalculation,SF."salaryFieldAttanChk" as salaryFieldAttanChk,SF."salaryFieldSide" as salaryFieldSide ,SF."salaryFieldIndex" as salaryFieldIndex,
  //                                                             SF."salaryFieldShow" as salaryFieldShow,SF."salaryFieldSrNo" as salaryFieldSrNo,
  //                                                             SMst."salaryMasterID" as salaryMasterID,SMst."userMasterID" as userMasterID,SMst."gradeSalaryStructureID" as gradeSalaryStructureID,SMst."EmployeeSalaryAmount" as EmployeeSalaryAmount,SMst."EmployeeSalaryPer" as EmployeeSalaryPer
  //                                                             ,SMst."salaryFromYYYYMM" as salaryFromYYYYMM,PH."payheadMasterId" as payheadMasterId,SF."salaryFieldRound" as salaryFieldRound,SF."salaryFieldRoundNo"  as salaryFieldRoundNo, 0 as attnval
  //                                                             ,0 as calcuationMonth,0 as EmpCalcuSalaryAmount
  //                                                             from public."gradeStructures" as GS
  //                                                             inner join public."gradeSalaryStructures" as GSS on GS."gradeStructureID"=GSS."gradeStructureID"
  //                                                             inner join public."hrSalaryFields" as SF on GSS."salaryFieldID" = SF."salaryFieldID"
  //                                                             Inner Join public."Payheadmasters" as PH on SF."payheadMasterId" = PH."payheadMasterId"
  //                                                             Inner Join
  //                                                             (SELECT   HSM."salaryMasterID", HSM."EmployeeSalaryAmount",HSM."EmployeeSalaryPer", HSM."gradeSalaryStructureID", B.*
  //                                                                         FROM    public."hrSalaryMasters" as HSM JOIN
  //                                                                     (SELECT     A."salaryFromYYYYMM", vEmp.*, ROW_NUMBER() OVER (partition BY A."userMasterID"
  //                                                                      ORDER BY "salaryFromYYYYMM" DESC) AS VN_Id	FROM
  //                                                                      (select distinct SM."userMasterID",SM."salaryFromYYYYMM"
  //                                                                         from public."gradeStructures" as GS
  //                                                                         inner join public."gradeSalaryStructures" as GSS on GS."gradeStructureID"=GSS."gradeStructureID"
  //                                                                         inner join public."hrSalaryFields" as SF on GSS."salaryFieldID" = SF."salaryFieldID"
  //                                                                         Inner Join public."Payheadmasters" as PH on SF."payheadMasterId" = PH."payheadMasterId"
  //                                                                         Inner Join public."hrSalaryMasters" as SM on GSS."gradeSalaryStructureID" = SM."gradeSalaryStructureID"
  //                                                                         Inner join public."userMasters" as UM on SM."userMasterID"=UM."userMasterID"
  //                                                                         Left Outer join public."employeeJoiningDetails" as UMJD on UM."userMasterID"=UMJD."userMasterID"
  //                                                                         where  UM."status"=1 and "leavingDate" is null and SF."salaryFieldShow"='Y' and SF."companyMasterID"=cmpid  and SM."salaryFromYYYYMM"<=finyear AND UM."userMasterID"=USERID) AS A
  //                                                                         INNER JOIN public.ms_view_employeedetails AS vEmp ON A."userMasterID" = vEmp."userMasterID") AS B
  //                                                                         ON  HSM."userMasterID" = B."userMasterID" AND HSM."salaryFromYYYYMM"  = B."salaryFromYYYYMM"  AND B.VN_Id = 1 	WHERE  HSM."status"=1) as SMst on GSS."gradeSalaryStructureID" = SMst."gradeSalaryStructureID";
  //                 END;

  //         $BODY$;
  //         `,
  //   },

  {
    title: 'funmintohrs',
    name: 'Ms_fun_min_to_hrs',
    definition: `
                Drop function if exists Ms_fun_min_to_hrs(int);
                CREATE OR REPLACE FUNCTION Ms_fun_min_to_hrs(mins int)
                RETURNS numeric AS
                $BODY$ 
                select  cast(date_part('hours',interval '1 minute' * mins) * 1.0 + 
                (date_part('minutes',interval '1 minute' * mins) * .01) as numeric(18,2));
                $BODY$
                LANGUAGE sql VOLATILE
        `,
  },
  {
    title: 'ShiftTimeMinCalc',
    name: 'Ms_fun_shiftTimes_min',
    definition: `

            Drop function if exists Ms_fun_shiftTimes_min(int,varchar);
        
            CREATE OR REPLACE FUNCTION Ms_fun_shiftTimes_min(shiftid int,dayname varchar)
            RETURNS float AS
            $BODY$ 

            select 
                coalesce((DATE_PART('hour',"secondhalfstarttime" ::time - "firsthalfendtime"::time) * 60 +
                DATE_PART('minute', "secondhalfstarttime"::time - "firsthalfendtime"::time)),0) as Mindiff
                from public."shiftTimes" where "shiftID"=shiftid and trim("day")=trim(dayname);
            $BODY$
            LANGUAGE sql VOLATILE
        `,
  },
  {
    title: 'GetAttendanceCalc',
    name: 'Ms_Fun_GetAttendanceCalc',
    definition: `
        DROP FUNCTION IF EXISTS public.Ms_Fun_GetAttendanceCalc(integer, date,date);
       
CREATE OR REPLACE FUNCTION public.ms_fun_getattendancecalc(
	cmid integer,
	fromdate date,
	todate date)
    RETURNS TABLE(attendancedate date, attcalc numeric, cmpid integer, usermasterid integer, totalhr numeric, attday character varying, shiftid integer, mincalc numeric, shifthr numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
            DECLARE 
                var_r record;                                             
               	attcalculation numeric;
				shittothr numeric;
				secondhalfday numeric;
				Mindif numeric;
				TEMPNUM numeric;
                BEGIN
                  drop table if exists temp_structure;
                  create temp table temp_structure (
					  		AttendanceDate date,
							AttCalc numeric,
							cmpid int,
							userMasterId int,
							TotalHr numeric,
							AttDay varchar,
					  		shiftID int,
                            Mincalc numeric,
					  		shiftHr numeric
                      
                             );
                
                attcalculation:=0;
				Mindif:=0;
                FOR var_r IN(
                               
							select coalesce((select * from public.ms_fun_min_to_hrs(CAST(att."InHrs" as integer))),0) as TotalHrs,
							to_char(att."AttendanceDate", 'Day') AS Dayname,
							att."AttendanceDate" as AttendanceDate,att."Shifthrs" as Shifthrs,att."ShiftIntime" as ShiftIntime,att."ShiftoutTime" as ShiftoutTime,
							att."userMasterID" as userMasterID,att."Panalty",att."PanaltyDeduction",
							sh."shiftID" as shiftID,sh."allowDays" as allowDays,sh."companyMasterID" as companyMasterID,sh."recuring",sh."shiftDesc"
							,coalesce((select *  from Ms_fun_shiftTimes_min(sh."shiftID",to_char(att."AttendanceDate", 'Day'))),0) as Mindiff
							from public."attendanceTransactions" as att inner join public."shifts" as sh
							on CAST(att."Shift" AS integer )=sh."shiftID"
							where  att."AttendanceDate" between  FromDate and Todate and  sh."companyMasterID"=cmid 
                            )  
                LOOP
              
				attcalculation:=0;
				Mindif:=0;
				select  coalesce("totalhours",0) from public."shiftTimes" where "shiftID"=var_r.shiftID and trim("day")=trim(var_r.Dayname) into shittothr;
				
				--select "secondhalfstarttime" from public."shiftTimes" where "shiftID"=var_r.shiftID and "day"=var_r.Dayname into secondhalfday;
				
				
				--select *  from Ms_fun_shiftTimes_min(var_r.shiftID,var_r.Dayname) Into Mindif;
				
				select * from public.ms_fun_min_to_hrs(CAST(var_r.Mindiff  as integer)) Into TEMPNUM;
				
				IF var_r.TotalHrs !=0 THEN
					IF var_r.TotalHrs>=shittothr THEN
						attcalculation:=1;
					ELSE
						IF var_r.TotalHrs<=TEMPNUM THEN
							attcalculation:=0.5;
						ELSE
					 		attcalculation:=0;
						END IF;
					END IF;
				END IF;
				
				--IF shittothr>=var_r.TotalHrs THEN
				--	attcalculation:=1;
			--	ELSE 
				--	IF Mindif<=var_r.TotalHrs THEN
				--		attcalculation:=0.5;
				--	ELSE
				--	 	attcalculation:=0;
				--	END IF;
				--END IF;
				
				
                INSERT INTO temp_structure VALUES (
							var_r.AttendanceDate,
							attcalculation,
							cmid,
							var_r.userMasterID,
							var_r.TotalHrs,
							var_r.Dayname,
							var_r.shiftID,
							TEMPNUM,
							shittothr
					
							);
                
                END LOOP;
                 RETURN QUERY select * from temp_structure ;
                END; 
           
                           
        
        $BODY$;
        `,
  },
  {
    title: 'AddLeaveBalanceCompanyWise',
    name: 'Ms_fun_AddLeaveBalanceCompanyWise',
    definition: `
         Drop FUNCTION IF EXISTS  Ms_fun_AddLeaveBalanceCompanyWise(int);
                     CREATE OR REPLACE FUNCTION Ms_fun_AddLeaveBalanceCompanyWise(
                        companyID int
                        ) RETURNS TABLE (
                         LeaveTranID int,LeaveID int,Leave_Max_Days int,
                                   Leave_per_Days float,Add_per_month_Leave numeric) AS $$
                    BEGIN
                          RETURN QUERY
                            select "LeaveTranId","LeaveID","Leave_Max_Days","Leave_per_Days" 
                            ,round((("Leave_Max_Days")::decimal/12), 2) as Add_per_month_Leave
                            from public."hrLeaveTypes"
                            where "status"=1 and "Leave_Max_Days"<>0 and "companyMasterID"=companyID;
                    END;
                    $$ LANGUAGE 'plpgsql';
        
        `,
  },
  {
    title: 'PresendAttSumUserwise',
    name: 'Ms_fun_PresendAtt_Sum_Userwise',
    definition: `
            Drop function if exists Ms_fun_PresendAtt_Sum_Userwise(int,date,date,numeric);


            
            CREATE OR REPLACE FUNCTION public.ms_fun_presendatt_sum_userwise(
	        cmpid integer,
	        fromdate date,
	        todate date,
	        userid numeric)
            RETURNS TABLE(totalpresent numeric) 
            LANGUAGE 'plpgsql'
    

            AS $BODY$
                    BEGIN
      			        RETURN QUERY
                        select sum(attcalc) as TotalPresent from public.ms_fun_getattendancecalc(cmpid,fromdate,todate) where usermasterid=userid;
                    END;
            
            $BODY$;
        `,
  },
  {
    title: 'FullDayHalfDayCalculation',
    name: 'MS_Fun_FullDayHalfDayCalculation',
    definition: `
                    DROP FUNCTION IF EXISTS public.MS_Fun_FullDayHalfDayCalculation(integer,varchar,numeric);
            CREATE OR REPLACE FUNCTION public.MS_Fun_FullDayHalfDayCalculation(
                shiftID integer,
                Dayname varchar,
                TotalWorkMin numeric)
                RETURNS TABLE(FullDayHalfDay numeric) 
                LANGUAGE 'plpgsql'
                AS $BODY$
                DECLARE 
                                                                    
                            attcalculation numeric;
                            shittothr numeric;
                            secondhalfday numeric;
                            Mindif numeric;
                            TotalHrs numeric;
                            TEMPNUM numeric;
                BEGIN
                    drop table if exists temp_structure;
                    create temp table temp_structure (					  		
                                        AttCalc numeric                      
                                        );
                                        
                            select  cast(coalesce("totalhours",0) as numeric) from public."shiftTimes" where "shiftID"=shiftID and trim("day")=trim(Dayname) into shittothr;
                            
                            select * from public.ms_fun_min_to_hrs(CAST(TotalWorkMin  as integer)) Into TotalHrs;
                            
                            select * from public.ms_fun_min_to_hrs(CAST(coalesce((select *  from Ms_fun_shiftTimes_min(shiftID,trim(Dayname))),0) as integer)) Into TEMPNUM;
                            
                            IF TotalHrs !=0 THEN
                                IF TotalHrs>=shittothr THEN
                                    attcalculation:=1;
                                ELSE
                                    IF TotalHrs>=TEMPNUM THEN
                                        attcalculation:=0.5;
                                    ELSE
                                        attcalculation:=0;
                                    END IF;
                                END IF;
                            END IF;
                            
                            
                            INSERT INTO temp_structure VALUES (							
                                        attcalculation	
                                        );
                                        
                        RETURN QUERY select * from temp_structure ;
                end
                            
            $BODY$;
        
        `,
  },
  {
    title: 'GetDayWise_attendancecalc',
    name: 'ms_fun_getDayWise_attendancecalc',
    definition: `
        DROP FUNCTION IF EXISTS public.ms_fun_getDayWise_attendancecalc(integer,date,date);
        CREATE OR REPLACE FUNCTION public.ms_fun_getDayWise_attendancecalc(
            uid integer,
            fromdate date,
            todate date)	
             RETURNS TABLE(AttCalc numeric) 
            LANGUAGE 'plpgsql'
            AS $BODY$
             DECLARE 
                       
                        attcalculation numeric;
                        BEGIN
                          drop table if exists temp_structure;
                          create temp table temp_structure (					  		
                                    AttCalc numeric
                                     );
        
                            select sum(coalesce(att."fulldayhalfday",0)) DayAtt from public."attendanceTransactions" as att
                            where att."AttendanceDate" between  fromdate and todate and att."userMasterID"=uid into attcalculation;
        
          
                                    INSERT INTO temp_structure VALUES (							
                                                attcalculation	
                                                );
                                                
                                RETURN QUERY select * from temp_structure ;
                        end;
                                    
           $BODY$;
        
        `,
  },
  {
    title: 'UserLeaveClosingBalance',
    name: 'MS_Fun_UserLeaveClosingBalance',
    definition: `
        DROP FUNCTION IF EXISTS public.MS_Fun_UserLeaveClosingBalance(integer,integer);
            CREATE OR REPLACE FUNCTION public.MS_Fun_UserLeaveClosingBalance(
                UserID integer,
                LeaveTranId integer)
                RETURNS TABLE(ClosingBalance numeric,AddLeaveSum numeric,UsedLeaveSum numeric) 
                LANGUAGE 'plpgsql'
                AS $BODY$
                DECLARE 
                                                                    
                            AddLeaveSum numeric;
                            UsedLeaveSum numeric;
							TotalDiff numeric;
                           
                BEGIN
                    drop table if exists temp_structure;
                    create temp table temp_structure (					  		
                                        ClosingBalance numeric ,AddLeaveSum numeric,UsedLeaveSum numeric                     
                                        );
                                        
                           		 AddLeaveSum:=0;
								 UsedLeaveSum:=0;
								 TotalDiff:=0;
							
									select 
									coalesce(sum(cast("LeaveAddNew" as numeric)),0)+coalesce(sum("OPBal"),0) as TotalAdd
									from public."hrLeaveBalances" where "userMasterID"=UserID and "LeaveTranId"=LeaveTranId
									group by "LeaveTranId","userMasterID" Into AddLeaveSum;
									
									
									
									select coalesce(sum(LTran."days"),0) as UsedLeave from public."userLeaveTransactions" as LTran inner join
									public."leaveAuthorizations" as LAuth on LTran."leaveAuthID"=LAuth."AuthorizationRequestId"
									where LAuth."userMasterID"=UserID and LTran."LeaveTranId"=LeaveTranId
									group by LTran."LeaveTranId",LAuth."userMasterID" into UsedLeaveSum;
							
							if UsedLeaveSum=0 or UsedLeaveSum IS NULL then
									UsedLeaveSum:=0;
							end if;	
                            TotalDiff:= (AddLeaveSum-UsedLeaveSum);
                            
                            INSERT INTO temp_structure VALUES (							
                                        TotalDiff,
										AddLeaveSum,
										UsedLeaveSum
                                        );
                                        
                        RETURN QUERY select * from temp_structure ;
                end;
                            
            $BODY$;
        
        `,
  },
];

let createMethod = (name) => {
  // return async function (req, res, next) {
  //     let result = await executeQuery("SELECT * from " + name + "(4,28000);")
  //     res.status(200).json({ status: 200, message: "SELECT * from " + name + "(4,28000);", data: result });
  // }

  return async function (req, res, next) {
    let { parameters } = req.body;
    let query = 'SELECT * FROM ' + name + '(';
    if (parameters) {
      for (var i = 0; i < parameters.length; i++)
        query = query + parameters[i] + ',';
      query = query.substring(0, query.length - 1);
      console.log(query);
    }
    query = query + ');';
    let result = await executeQuery(query);
    res.status(200).json({ status: 200, message: query, data: result });
  };
};

for (var f of functions) {
  //   console.log('getting f', f);
  exports[f.title] = createMethod(f.name);
}

exports.functions = functions;

exports.createFunctions = async (req, res, next) => {
  try {
    let result;
    for (const f of functions) {
      result = await executeQuery(f.definition);
      console.log(result);
    }
    res.status(200).json({ status: 200, message: usermessage.functioncreated });
  } catch (err) {
    next(err);
  }
};

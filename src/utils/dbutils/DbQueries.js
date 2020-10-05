class DbQueries {
  /**
   * @param {DbConfig} dbConfig
   * @param {String} customerId E.g. 9140698645013660301
   */
  static queryGetAllBillingActionStatus(dbConfig, customerId) {
    const query = `
                  SELECT
                      ba.object_id AS ba_id,
                      substr(stv.value, 10) AS status
                  FROM
                      ${dbConfig.tables.nc_params_ix}     ba
                      LEFT JOIN ${dbConfig.tables.nc_params}        s ON s.object_id = ba.object_id
                                              AND s.attr_id = 9141614096913188381
                      LEFT JOIN ${dbConfig.tables.nc_list_values}   stv ON stv.list_value_id = s.list_value_id
                  WHERE
                      ba.value = to_char(${customerId}) /* Customer Id*/
                      AND ba.ix_key = pkgutils.params_ix(to_char(${customerId})) /* Customer Id*/
                      AND ba.attr_id = 9141251166913825730`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} customerId E.g. 9140698645013660301
   */
  static queryGetAllBillingFailedActionStatus(dbConfig, customerId) {
    const query = `select * from (${this.queryGetAllBillingActionStatus(
      dbConfig,
      customerId
    )}) where lower(status) = 'failed'`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} customerId E.g. 9140698645013660301
   */
  static queryManualCreditTaskId(dbConfig, customerId) {
    const query = `
                  select
                      object_id task_id
                  from
                      ${dbConfig.tables.nc_params}
                  where
                      object_id = (
                          select
                              object_id
                          from
                              ${dbConfig.tables.nc_objects}
                          where
                              object_id in (
                                  select
                                      p.object_id
                                  from
                                      ${dbConfig.tables.nc_params_ix} p
                                  where
                                      p.attr_id = 90100082 /* Target Object */
                                      and p.ix_key = ${customerId}
                              )
                              and name like '%Credit%'
                      )
                      and attr_id = 9137996003413538340 /* Task ID */
                `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} addObjId E.g. 9140698645013660301
   */
  static queryCompleteAddress(dbConfig, addObjId) {
    const query = `select listagg(name, ' ') within group (order by object_id desc) complete_address from ${dbConfig.tables.nc_objects} 
                 where CONNECT_BY_ISLEAF = 0 start with object_id = '${addObjId}'
                 connect by prior parent_id = object_id`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   * @param {String} ncObjId E.g. 9149844833813831138
   */
  static queryNcObjectNameOnId(dbConfig, ncObjId) {
    const query = `select name from ${dbConfig.tables.nc_objects} where object_id = '${ncObjId}'`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcSaleOrderObjectTypeId(dbConfig) {
    const query = `select object_type_id from ${dbConfig.tables.nc_object_types} where name = 'Sales Order'`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcSaleOrderInternalId(dbConfig, orderNumberAsSuffix) {
    const query = `
                  SELECT
                      OBJECT_ID AS SalesOrderInternalId
                  FROM
                      ${dbConfig.tables.nc_objects}        nco,
                      ${dbConfig.tables.nc_object_types}   ncot
                  WHERE
                      nco.object_type_id = ncot.object_type_id
                      AND ncot.name = 'Sales Order'
                      AND nco.name LIKE '%${orderNumberAsSuffix}'`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcCustomerIdFromSaleOrderNumber(dbConfig, orderNumberAsSuffix) {
    const query = `
                  SELECT
                      parent_id
                  FROM
                      ${dbConfig.tables.nc_objects}
                  WHERE
                      object_id = (
                          SELECT
                              nco.parent_id
                          FROM
                              ${dbConfig.tables.nc_objects}        nco,
                              ${dbConfig.tables.nc_object_types}   ncot
                          WHERE
                              nco.object_type_id = ncot.object_type_id
                              AND ncot.name = 'Sales Order'
                              AND nco.name LIKE '%${orderNumberAsSuffix}'
                      )
                `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcCustomerOrdersStatus(dbConfig, customerId) {
    const query = `
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 4063055154013004350 /* Status */
                      AND orders.object_type_id NOT IN (
                          9134179704813622905 /* BOE Composite Order */
                      )
                      AND status_id.object_id IN (
                          SELECT DISTINCT
                              object_id
                          FROM
                              ${dbConfig.tables.nc_references}
                          WHERE
                              attr_id = 4122753063013175631 /* Customer Account */
                              AND reference = ${customerId}
                      )
                      AND lv.list_value_id = status_id.list_value_id
                  UNION
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9124623752913888363 /* Status */
                      AND orders.object_type_id IN (
                          9134179704813622905 /* BOE Composite Order */
                      )
                      AND status_id.object_id IN (
                          SELECT DISTINCT
                              object_id
                          FROM
                              ${dbConfig.tables.nc_references}
                          WHERE
                              attr_id = 4122753063013175631 /* Customer Account */
                              AND reference = ${customerId}
                      )
                      AND lv.list_value_id = status_id.list_value_id
                  UNION
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9126090157513456523 /* Sales Order Status */
                      AND status_id.object_id IN (
                          SELECT
                              object_id
                          FROM
                              ${dbConfig.tables.nc_objects}
                          WHERE
                              parent_id IN (
                                  SELECT
                                      object_id
                                  FROM
                                      ${dbConfig.tables.nc_objects}
                                  WHERE
                                      parent_id = ${customerId}
                                      AND object_type_id = 4070674633013011019 /* Order Management Project */
                              )
                      )
                      AND lv.list_value_id = status_id.list_value_id
    `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
    dbConfig,
    customerId
  ) {
    let query = this.queryNcCustomerOrdersStatus(dbConfig, customerId);
    query = `
            select * from (${query}) order_status_table
            WHERE
              upper(status) NOT LIKE '%COMPLETED%'
              AND upper(status) NOT LIKE '%PROCESSED%'`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcSalesOrdersStatusForGivenCustomer(dbConfig, customerId) {
    const query = `
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9126090157513456523 /* Sales Order Status */
                      AND status_id.object_id IN (
                          SELECT
                              object_id
                          FROM
                              ${dbConfig.tables.nc_objects}
                          WHERE
                              parent_id IN (
                                  SELECT
                                      object_id
                                  FROM
                                      ${dbConfig.tables.nc_objects}
                                  WHERE
                                      parent_id = ${customerId}
                                      AND object_type_id = 4070674633013011019 /* Order Management Project */
                              )
                      )
                      AND lv.list_value_id = status_id.list_value_id`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryNcSalesOrdersStatus(dbConfig, orderNumberAsSuffix) {
    const query = `
                  SELECT
                      orders.name   orders,
                      orders.object_id,
                      status_id.list_value_id,
                      lv.value      status
                  FROM
                      ${dbConfig.tables.nc_objects}       orders,
                      ${dbConfig.tables.nc_params}        status_id,
                      ${dbConfig.tables.nc_list_values}   lv
                  WHERE
                      orders.object_id = status_id.object_id
                      AND status_id.attr_id = 9126090157513456523 /* Sales Order Status */
                      AND status_id.object_id IN (
                          ${this.queryNcSaleOrderInternalId(
                            orderNumberAsSuffix
                          )}
                      )
                      AND lv.list_value_id = status_id.list_value_id`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryErrorsForGivenCustomer(dbConfig, customerId) {
    const query = `
                  SELECT
                      object_id,
                      name
                  FROM
                      ${dbConfig.tables.nc_objects}
                  WHERE
                      parent_id IN (
                          SELECT
                              container_id AS object_id
                          FROM
                              ${dbConfig.tables.nc_po_tasks},
                              ${dbConfig.tables.nc_objects} o
                          WHERE
                              order_id = object_id
                              AND o.parent_id = ${customerId} /* Customer ID */
                      )
                      AND object_type_id IN (
                          SELECT
                              object_type_id
                          FROM
                              ${dbConfig.tables.nc_object_types}
                          START WITH
                              object_type_id = 9081958832013375989 /* Base Error Record */
                          CONNECT BY
                              PRIOR object_type_id = parent_id
                      )
    `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryWorkOrderNumberFromCustomerInternalId(
    dbConfig,
    customerInternalId
  ) {
    const query = `
                  SELECT
                      p.value       AS work_order_number,
                      o.object_id   AS object_id,
                      o.name as orderName
                  FROM
                      ${dbConfig.tables.nc_objects}   o,
                      ${dbConfig.tables.nc_params}    p,
                      ${dbConfig.tables.nc_params}    pp
                  WHERE
                      o.parent_id = ${customerInternalId}
                      and o.object_type_id = 9138418725413841757 /* New/Modify Work Order */
                      and p.attr_id = 9138427811113852870 /* Work Order ID */
                      and o.object_id = p.object_id
                      and o.object_id = pp.object_id
                      and pp.attr_id = 4063055154013004350 /* Status */
                      AND pp.list_value_id NOT IN (
                          4121046730013113091 /* Completed */
                      )
                `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryShipmentOrderNumberAndPurchaseOrderNumberFromShipmentOrderInternalObjectId(
    dbConfig,
    shipmentObjectId
  ) {
    const query = `
                SELECT
                    value AS shipmentordernumber,
                    ${shipmentObjectId} as purchaseOrderNumber
                FROM
                    ${dbConfig.tables.nc_params}
                WHERE
                    object_id = ${shipmentObjectId}
                    AND attr_id = (
                        SELECT
                            attr_id
                        FROM
                        ${dbConfig.tables.nc_attributes}
                        WHERE
                            name = 'Shipment Order Number'
                    )
                `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryCustomerIdFromCustomerName(dbConfig, customerName) {
    const query = `
                  select
                              Object_ID
                          from
                              nc_objects
                          where
                              OBJECT_TYPE_ID = 2091641841013994133 and upper(NAME) Like upper('%${customerName}%')`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryChangeFlagtoMigrated(dbConfig, customerId) {
    const query = `
                  
        merge into nc_params t
                    using
                    (
                    select
                        9144723913513165974 as list_value_id, 9144723841513165963 as attr_id, ${customerId} as customer_id  /* Migrating - 9144723913513165973, Migrated - 9144723913513165974 */
                    from dual
                    ) v on (t.object_id =v.customer_id and t.attr_id = v.attr_id)
                    when not matched then insert(attr_id, object_id, list_value_id) VALUES (v.attr_id, v.customer_id, v.list_value_id)
                    when matched then update set t.list_value_id = v.list_value_id`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryGetAllWorkOrdersForCustomer(dbConfig, customerId) {
    const query = `
                  
        SELECT
                      p.value       AS work_order_number,
                      o.object_id   AS object_id,
                      o.name as orderName
                  FROM
                      ${dbConfig.tables.nc_objects}   o,
                      ${dbConfig.tables.nc_params}    p,
                      ${dbConfig.tables.nc_params}    pp
                  WHERE
                      o.parent_id = ${customerId}
                      and o.object_type_id = 9138418725413841757 /* New/Modify Work Order */
                      and p.attr_id = 9138427811113852870 /* Work Order ID */
                      and o.object_id = p.object_id
                      and o.object_id = pp.object_id
                      and pp.attr_id = 4063055154013004350 /* Status */
                      
                `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryGetShipmentTask(dbConfig, orderId) {
    const query = `select task_id from nc_po_Tasks where order_id = ${orderId} and name = 'Hold Order Completion'`;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryProcessShipmentTask(dbConfig, taskId) {
    const query = `      
        BEGIN
        PKG_SHIPMENT.update_constraint_date(${taskId});
        END;
              
                `;
    return query;
  }

  /**
   * @param {DbConfig} dbConfig
   */
  static queryHoldOrderCompletionTask(dbConfig, purchaseorderNumber) {
    const query = `      
        select task_id from nc_po_Tasks where order_id = ${purchaseorderNumber} and name = 'Hold Order Completion'     
                `;
    return query;
  }

  static queryValidatePhoneServiceTask(dbConfig, phoneOrderNumber) {
    const query = `      
        select task_id from nc_po_Tasks where order_id = ${phoneOrderNumber} and name = 'Validate Service'     
                `;
    return query;
  }

  static queryValidateHomeSecurityTask(dbConfig, phoneOrderNumber) {
    const query = `      
        select task_id from nc_po_Tasks where order_id = ${phoneOrderNumber} and name = 'Home security Product Manual Task'     
                `;
    return query;
  }
}

module.exports = DbQueries;

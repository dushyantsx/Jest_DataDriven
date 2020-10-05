# Shipment

First step for fetching parameters for shipment xml:
let addMilliseconds = (utils.getRandomInt(0, 999999999 + 1)) \* 7

        let expectedDeliveryDate = new Date(new Date().getTime() + addMilliseconds)

        let trackingNumber = utils.getRandomInt(0, 999999999 + 1) + 'A'

        let orderNumber = null

        let purchaseOrderNumber = null


         shipper = 'CANADA POST'

Parameters highlighted by blue we need to get by SQL query.

So second step is to add the following query:
select o.object_id

    from nc_references r, nc_objects o

    where o.parent_id = :customerObjectId

    and r.attr_id = '9128424074813240903'

    and r.object_id = o.object_id

    and o.name like '%Shipment%'

It just requires to get Shipment product Order object id.
Save result to variable getProductOrder.

Then we will need add the following generic query what could be used everywhere with differen input parameters (getValuebyAttributeAndObject):
select VALUE

    from nc_params

    where object_id = :objectId

    and attr_id = :attr_id

To get orderNumber run the query above and put there – results from getProductOrder above to objectID
and put 9147905937313829852 to attr_id

To get purchaseOrderNumber run the query above and put there – results from getProductOrder above to objectID
and put 9137510645213276794 to attr_id

# Promo Codes:

SHS50
SEC5
3DIY – should be applied for Home Security with self-install option

# Manual Tasks

<server>/manualTask/performTaskAction/<taskObjectId>/complete

To get taskObjectID:

<pre>
select value task_id from nc_params
where object_id = (select object_id from nc_objects
                    where object_id in (select p.object_id from nc_params_ix p where p.attr_id = 90100082 and p.IX_KEY = :CAid)
                    and name like '%Credit%')
and attr_id = 9137996003413538340;
</pre>

# Work Order Number

select o.object_id as Object_id, p.value as work_Order_Id
from nc_objects o, nc_params p, nc_params pp
where o.parent_id = (:CAid)
and o.object_type_id = 9138418725413841757
and p.attr_id = 9138427811113852870
and o.object_id = p.object_id
and o.object_id = pp.object_id
and pp.attr_id = 4063055154013004350
and pp.LIST_VALUE_ID not in (4121046730013113091)

#
# python constants for ITC-SIM API
#

DF_COLS = {
    # 'triptype': 0, ?? where to get this?
    'vehicle': 0,
    'nodetype': 3,
    'schtime': 4,
    'lat': 12,
    'long': 13,
    'passcount': 14,
    'name': 16,
    'addr': 17,
    'reqtime': 19,
    'trvtime': 20,
    'trvdist': 21
}



DB_CONNECT_CRED = 'Driver={Sql Server};Server=192.168.13.91;Database=DispatchManagerDB;UID=sa;PWD=Regency1;'

# Without SET NOCOUNT ON in the query the whole query will break!!!!
DB_QUERY_TRIPS =  """
			Declare @dtSelectForFromDate Datetime
			Set @dtSelectForFromDate = '{{ date }}'
         SET NOCOUNT ON
            --drop  Table #MV_dtl_RouteInfo
            select * into #MV_dtl_RouteInfo from MV_dtl_RouteInfo with(nolock) where cast(dtTripDate as date) = cast(@dtSelectForFromDate as date)
            SELECT * FROM
            (
			SELECT RI.vVirtualRoute AS RouteNo, S.vExt2 AS JobNo,RI.iPUStopNumber AS StopNumber, 'P' AS NodeType, (case when convert(DATE, ISNULL(S.SchedulePickTime,'01/01/1900')) = convert(date,'01/01/1900') then ISNULL(S.dtPickupDate,'01/01/1900') else S.SchedulePickTime end) TripTime, ISNULL(S.TripRequestStatus,'NONE') AS Status
            ,(case when cast(ISNULL(S.dtActualPickup,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.SchedulePickTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.SchedulePickTime,S.dtActualPickup)) ELSE '' end)[ACT] --[PUACT]
            ,(case when cast(ISNULL(S.dtForcastedPUTime,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.SchedulePickTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.SchedulePickTime,S.dtForcastedPUTime)) ELSE '' end)[FCST] --[PUFCST]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtActualPickup)[Actual Time] --[Actual PU Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtForcastedPUTime)[Forecasted Time] --[PU Forecasted Time]
            --,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtPickupDate)[Requested Time] --[PU Requested Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.SchedulePickTime)[SCH] --[PU SCH]
            ,'' [LastFCST]
            ,Convert(VarChar,S.dPickupLatitude) Latitude
            ,Convert(VarChar,S.dPickupLongitude) Longitude
            ,S.nTotalPassengers 'Passenger Count',S.iRefID,s.vPickupPerson, s.vPickupAddress [StopAddress],s.vPickCity [StopCity],s.dtPickupDate [RequestTime],
            RI.dIdleTime WaitTime,
			RI.dPUEstTimeFromPrev EstimatedTimeFromPrevStop,
            RI.dPUEstDistFromPrev EstimatedDistFromPrevStop
            FROM dtl_TreatedServiceRequest S WITH(NOLOCK)
            LEFT OUTER JOIN #MV_dtl_RouteInfo RI WITH(NOLOCK) ON RI.iRefID = S.iRefID
            WHERE ISNULL(RI.vVirtualRoute,'') <> ''
			Union All
            SELECT RI.vVirtualRoute AS RouteNo, S.vExt2 AS JobNo,RI.iPUStopNumber AS StopNumber, 'P' AS NodeType, (case when convert(DATE, ISNULL(S.SchedulePickTime,'01/01/1900')) = convert(date,'01/01/1900') then ISNULL(S.dtPickupDate,'01/01/1900') else S.SchedulePickTime end) TripTime, ISNULL(S.TripRequestStatus,'NONE') AS Status
            ,(case when cast(ISNULL(S.dtActualPickup,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.SchedulePickTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.SchedulePickTime,S.dtActualPickup)) ELSE '' end)[ACT] --[PUACT]
            ,(case when cast(ISNULL(S.dtForcastedPUTime,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.SchedulePickTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.SchedulePickTime,S.dtForcastedPUTime)) ELSE '' end)[FCST] --[PUFCST]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtActualPickup)[Actual Time] --[Actual PU Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtForcastedPUTime)[Forecasted Time] --[PU Forecasted Time]
            --,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtPickupDate)[Requested Time] --[PU Requested Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.SchedulePickTime)[SCH] --[PU SCH]
            ,Case When (ISNULL(S.dtFCSTModifiedDate,'1/1/1900') = Convert(DateTime,'1/1/1900')) Then '' Else Convert(VarChar(2),S.dtFCSTModifiedDate,103) End  +' '+  [dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtFCSTModifiedDate)[LastFCST]
            ,Convert(VarChar,S.dPickupLatitude) Latitude
            ,Convert(VarChar,S.dPickupLongitude) Longitude
            ,S.nTotalPassengers 'Passenger Count',S.iRefID,s.vPickupPerson, s.vPickupAddress [StopAddress],s.vPickCity [StopCity],s.dtPickupDate [RequestTime],
            RI.dIdleTime WaitTime,
			RI.dPUEstTimeFromPrev EstimatedTimeFromPrevStop,
            RI.dPUEstDistFromPrev EstimatedDistFromPrevStop
            FROM ServiceRequestsOndemand S WITH(NOLOCK)
            LEFT OUTER JOIN #MV_dtl_RouteInfo RI WITH(NOLOCK) ON RI.iRefID = S.iRefID
            WHERE ISNULL(RI.vVirtualRoute,'') <> ''
            UNION ALL
            SELECT RI.vVirtualRoute AS RouteNo, S.vExt2 AS JobNo,RI.iDOStopNumber AS StopNumber, 'D' AS NodeType, S.ScheduleDropTime TripTime, ISNULL(S.TripRequestStatus,'NONE') AS Status
            ,(case when cast(ISNULL(S.dtActualDrop,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.ScheduleDropTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.ScheduleDropTime,S.dtActualDrop)) ELSE '' end)[ACT] --[DOACT]
            ,(case when cast(ISNULL(S.dtForcastedDOTime,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.ScheduleDropTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.ScheduleDropTime,S.dtForcastedDOTime)) ELSE '' end)[FCST] --[DOFCST]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtActualDrop)[Actual Time] --[Actual DO Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtForcastedDOTime)[Forecasted Time] --[DO Forecasted Time]
            --,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtDropDate)[Requested Time] --[DO Requested Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.ScheduleDropTime)[SCH] --[DO SCH]
            ,Case When (ISNULL(S.dtFCSTModifiedDate,'1/1/1900') = Convert(DateTime,'1/1/1900')) Then '' Else Convert(VarChar(2),S.dtFCSTModifiedDate,103) End  +' '+  [dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtFCSTModifiedDate)[LastFCST]
            ,Convert(VarChar,S.dDropLatitude) Latitude,
            Convert(VarChar,S.dDropLongitude) Longitude,
            S.nTotalPassengers 'Passenger Count',S.iRefID,s.vPickupPerson, s.vDropOffAddress [StopAddress],s.vDropCity [StopCity],s.dtPickupDate [RequestTime],
			0.0 WaitTime,
            RI.dDOEstTimeFromPrev EstimatedTimeFromPrevStop,
            RI.dDOEstDistFromPrev EstimatedDistFromPrevStop
            FROM ServiceRequestsOndemand S WITH(NOLOCK)
            LEFT OUTER JOIN #MV_dtl_RouteInfo RI WITH(NOLOCK) ON RI.iRefID = S.iRefID
            WHERE ISNULL(RI.vVirtualRoute,'') <> ''
			  UNION ALL
            SELECT RI.vVirtualRoute AS RouteNo, S.vExt2 AS JobNo,RI.iDOStopNumber AS StopNumber, 'D' AS NodeType, S.ScheduleDropTime TripTime, ISNULL(S.TripRequestStatus,'NONE') AS Status
            ,(case when cast(ISNULL(S.dtActualDrop,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.ScheduleDropTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.ScheduleDropTime,S.dtActualDrop)) ELSE '' end)[ACT] --[DOACT]
            ,(case when cast(ISNULL(S.dtForcastedDOTime,'01/01/1900') as date) <> cast('01/01/1900' as date) AND cast(ISNULL(S.ScheduleDropTime,'01/01/1900') as date) <> cast('01/01/1900' as date) then CONVERT(varchar(25),DATEDIFF(MINUTE,S.ScheduleDropTime,S.dtForcastedDOTime)) ELSE '' end)[FCST] --[DOFCST]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtActualDrop)[Actual Time] --[Actual DO Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtForcastedDOTime)[Forecasted Time] --[DO Forecasted Time]
            --,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.dtDropDate)[Requested Time] --[DO Requested Time]
            ,[dbo].[ufn_GetDateTimeFormat]('hh:mm24hrEmpty1900',S.ScheduleDropTime)[SCH] --[DO SCH]
            ,'' [LastFCST]
            ,Convert(VarChar,S.dDropLatitude) Latitude,
            Convert(VarChar,S.dDropLongitude) Longitude,
            S.nTotalPassengers 'Passenger Count',S.iRefID,s.vPickupPerson, s.vDropOffAddress [StopAddress],s.vDropCity [StopCity],s.dtPickupDate [RequestTime],
			0.0 WaitTime,
            RI.dDOEstTimeFromPrev EstimatedTimeFromPrevStop,
            RI.dDOEstDistFromPrev EstimatedDistFromPrevStop
            FROM dtl_TreatedServiceRequest S WITH(NOLOCK)
            LEFT OUTER JOIN #MV_dtl_RouteInfo RI WITH(NOLOCK) ON RI.iRefID = S.iRefID
            WHERE ISNULL(RI.vVirtualRoute,'') <> ''
			) A order by RouteNO, StopNumber
            """

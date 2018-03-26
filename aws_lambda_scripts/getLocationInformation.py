import requests
import json

"""
New method to handle
"""


# def getLocationInformation_aws(event, context):
#     print(context)
#     if event is None:
#         return {'status': 'Error'}
#     print(event)
#     if event['start_placeid'] is None or len(event['start_placeid']) == 0:
#         return {'status': 'Error'}
#
#     if event['end_placeid'] is None or len(event['end_placeid']) == 0:
#         return {'status': 'Error'}
#
#     if event['mode'] is None or len(event['mode']) == 0:
#         return {'status': 'Error'}
#
#     start_placeid = ""
#     for placeid in event['start_placeid']:
#         start_placeid += placeid + "|"
#
#     start_placeid = start_placeid[0:-1]
#
#     end_placeid = ""
#     for placeid in event['end_placeid']:
#         end_placeid += placeid + '|'
#
#     end_placeid = end_placeid[0:-1]
#
#     # start_placeid = "place_id:ChIJSxh5JbJqkFQRxI1KoO7oZHs"
#     # end_placeid = "place_id:ChIJ55fLWVtBkFQR0v31eadEoLM|place_id:ChIJ3S-JXmauEmsRUcIaWtf4MzE"
#     # mode = "bicycling"
#
#     mode = event['mode']
#     url = "https://maps.googleapis.com/maps/api/distancematrix/json"
#     params = {"origins": start_placeid,
#               "destinations": end_placeid,
#               "mode": mode,
#               "key": key}
#
#     response = requests.get(url, params)
#
#     if not response.ok:
#         return {'status': 'Error'}
#
#     json_response = json.loads(response.content)
#     if json_response['status'] != 'OK':
#         return {'status': 'Error'}
#
#     print(json_response)
#
#     if json_response is None:
#         return {'status': 'Error'}
#
#     result = []
#
#     if 'rows' not in json_response or len(json_response['rows']) == 0:
#         return None
#
#     for row in json_response['rows']:
#         if 'elements' not in row or len(row['elements']) == 0:
#             continue
#         for element in row['elements']:
#             elem = {}
#             if element['status'] == 'OK':
#                 elem['status'] = 'Ok'
#                 elem['distance_text'] = element['distance']['text']
#                 elem['distance_value'] = element['distance']['value']
#                 elem['duration_text'] = element['duration']['text']
#                 elem['duration_value'] = element['duration']['value']
#             else:
#                 elem['status'] = 'Error'
#             result.append(elem)
#
#     print(result)
#     return {'status': 'Ok', "result": result}


# Sending duration of four distances
# 1. Previous Meeting End Location to Current Meeting origin location
# 2. Previous Meeting End Location to Current Meeting destination location
# 3. current Meeting End Location to next Meeting Origin Location
# 4. current Meeting End Location to next Meeting Destination Location



def getLocationInformation(event, context):
    print("Input Event")
    print(event)

    if event is None:
        return sendingResultValues(False, "")
        # return result

    '''
    { "currentLocationOrigin": "ChIJa8f1cO8IK4cRhFzAxK2hLPc",
  "currentLocationDestination": "ChIJffoao2cJK4cRpDZy6Da-T8E",
  "previousMeetingOriginPlaceId": "ChIJa8f1cO8IK4cRhFzAxK2hLPc",
  "previousMeetingDestinationPlaceId": "ChIJffoao2cJK4cRpDZy6Da-T8E",
  "nextMeetingOriginPlaceId": "ChIJa8f1cO8IK4cRhFzAxK2hLPc",
  "nextMeetingDestinationPlaceId": "ChIJ63Gg390IK4cR-2otT7FBoI0",
  "travelMode": "driving",
  "previousMeetingStartTime": 1518058800000,
  "previousMeetingEndTime": 1518062400000,
  "currentMeetingStartTime": 1518058800000,
  "currentMeetingEndTime": 1518062400000,
  "nextMeetingStartTime": 1518127200000,
  "nextMeetingEndTime": 1518130800000
}

    '''

    print(type(event))
    currentLocationOrigin = ""
    currentLocationDestination = ""
    previousMeetingOriginPlaceId = ""
    previousMeetingDestinationPlaceId = ""
    nextMeetingOriginPlaceId = ""
    nextMeetingDestinationPlaceId = ""
    travelMode = ""

    nextMeetingId = ""
    previousMeetingId = ""

    previousMeetingEndTime = 0
    previousMeetingStartTime = 0
    currentMeetingStartTime = 0
    currentMeetingEndTime = 0
    nextMeetingStartTime = 0
    nextMeetingEndTime = 0

    if 'travelMode' in event and len(event['travelMode'].strip()) != 0:
        travelMode = event['travelMode'].strip()
    else:
        return sendingResultValues(False, "")

    if 'currentLocationOrigin' in event and len(event['currentLocationOrigin'].strip()) != 0:
        currentLocationOrigin = "place_id:" + event['currentLocationOrigin'].strip()

    if 'currentLocationDestination' in event and len(event['currentLocationDestination'].strip()) != 0:
        currentLocationDestination = "place_id:" + event['currentLocationDestination'].strip()

    if 'previousMeetingOriginPlaceId' in event and len(event['previousMeetingOriginPlaceId'].strip()) != 0:
        previousMeetingOriginPlaceId = "place_id:" + event['previousMeetingOriginPlaceId'].strip()

    if 'previousMeetingDestinationPlaceId' in event and len(event['previousMeetingDestinationPlaceId'].strip()) != 0:
        previousMeetingDestinationPlaceId = "place_id:" + event['previousMeetingDestinationPlaceId'].strip()

    if 'nextMeetingOriginPlaceId' in event and len(event['nextMeetingOriginPlaceId'].strip()) != 0:
        nextMeetingOriginPlaceId = "place_id:" + event['nextMeetingOriginPlaceId'].strip()

    if 'nextMeetingDestinationPlaceId' in event and len(event['nextMeetingDestinationPlaceId'].strip()) != 0:
        nextMeetingDestinationPlaceId = "place_id:" + event['nextMeetingDestinationPlaceId'].strip()

    if event['previousMeetingStartTime'] is not None:
        previousMeetingStartTime = event['previousMeetingStartTime']

    if event['previousMeetingEndTime'] is not None:
        previousMeetingEndTime = event['previousMeetingEndTime']

    if event['currentMeetingStartTime'] is not None:
        currentMeetingStartTime = event['currentMeetingStartTime']

    if event['currentMeetingEndTime'] is not None:
        currentMeetingEndTime = event['currentMeetingEndTime']

    if event['nextMeetingStartTime'] is not None:
        nextMeetingStartTime = event['nextMeetingStartTime']

    if event['nextMeetingEndTime'] is not None:
        nextMeetingEndTime = event['nextMeetingEndTime']

    if event['nextMeetingId'] is not None:
        nextMeetingId = event['nextMeetingId']

    if event['previousMeetingId'] is not None:
        previousMeetingId = event['previousMeetingId']

    print("BBBB")

    print(currentLocationOrigin)
    print(currentLocationDestination)
    print(previousMeetingOriginPlaceId)
    print(previousMeetingDestinationPlaceId)
    print(nextMeetingOriginPlaceId)
    print(nextMeetingDestinationPlaceId)

    print(previousMeetingStartTime)
    print(previousMeetingEndTime)
    print(currentMeetingStartTime)
    print(currentMeetingEndTime)

    print(nextMeetingStartTime)
    print(nextMeetingEndTime)
    print(travelMode)

    result = [0, 0, 0, 0]
    durationCurrent = getDurationbetweenTwoLocations(currentLocationOrigin, currentLocationDestination, travelMode)
    durationNext = getDurationbetweenTwoLocations(nextMeetingOriginPlaceId, nextMeetingDestinationPlaceId, travelMode)

    result[0] = getDurationbetweenTwoLocations(previousMeetingDestinationPlaceId, currentLocationOrigin, travelMode)
    result[1] = getDurationbetweenTwoLocations(previousMeetingDestinationPlaceId, currentLocationDestination,
                                               travelMode)
    # if isConflictPresentForTwoLocations(previousMeetingStartTime, previousMeetingEndTime + result[0],
    #                                     currentMeetingStartTime, currentMeetingEndTime): and isConflictPresentForTwoLocations(previousMeetingStartTime, previousMeetingEndTime + result[1],
    #                                     currentMeetingStartTime, currentMeetingEndTime):

    print(previousMeetingEndTime + result[0])
    print(currentMeetingStartTime - durationCurrent)
    print(previousMeetingEndTime + result[1])
    print(currentMeetingStartTime)
    print(result)

    if (previousMeetingDestinationPlaceId != "" and previousMeetingEndTime + result[0] > (
        currentMeetingStartTime - durationCurrent) and previousMeetingEndTime + result[1] > currentMeetingStartTime):
        return sendingResultValues(True, previousMeetingId)

    result[2] = getDurationbetweenTwoLocations(currentLocationDestination, nextMeetingOriginPlaceId, travelMode)
    result[3] = getDurationbetweenTwoLocations(currentLocationDestination, nextMeetingDestinationPlaceId, travelMode)

    # if isConflictPresentForTwoLocations(currentMeetingStartTime, currentMeetingEndTime + result[2],
    #                                     nextMeetingStartTime, nextMeetingEndTime): and isConflictPresentForTwoLocations(currentMeetingStartTime, currentMeetingEndTime + result[3],
    #                                     nextMeetingStartTime, nextMeetingEndTime):
    #     return True
    if (nextMeetingOriginPlaceId != "" and currentMeetingEndTime + result[2] > (
        nextMeetingStartTime - durationNext) and currentMeetingEndTime + result[3] > nextMeetingStartTime):
        return sendingResultValues(True, nextMeetingId)

    print(result)
    return sendingResultValues(False, "")


# Adding the conflict Meeting result format
def sendingResultValues(isConflictPresent, conflictMeetingId):
    result = {"isConflictPresent" : isConflictPresent,
              "conflictMeetingId" : conflictMeetingId
    }
    return result


def isConflictPresentForTwoLocations(eventStart1, eventEnd1, eventStart2, eventEnd2):
    if (eventStart1 == 0 or eventStart2 == 0 or eventEnd1 == 0 or eventEnd2 == 0):
        return False

    min1 = min(eventStart1, eventStart2)
    max1 = max(eventEnd1, eventEnd2)

    if ((max1 - min1) < ((eventEnd1 - eventStart1) + (eventEnd2 - eventStart2))):
        return True

    return False


def getDurationbetweenTwoLocations(start_placeid, end_placeid, mode):
    duration_in_milleseconds = 0

    if start_placeid is None or end_placeid is None or start_placeid.strip() == "" or end_placeid.strip() == "":
        return duration_in_milleseconds

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    key = "AIzaSyAFcqYxQE7IZjZtZ7tgMt_wb_1ghRCKbXk"
    params = {"origins": start_placeid,
              "destinations": end_placeid,
              "mode": mode,
              "key": key}

    try:
        response = requests.get(url, params)

        if not response.ok:
            return duration_in_milleseconds

        json_response = json.loads(response.content)
        if json_response['status'] != 'OK':
            return duration_in_milleseconds

        print(json_response)

        if json_response is None:
            return duration_in_milleseconds

        if 'rows' not in json_response or len(json_response['rows']) == 0:
            return duration_in_milleseconds

        for row in json_response['rows']:
            if 'elements' not in row or len(row['elements']) == 0:
                continue
            for element in row['elements']:
                if element['status'] == 'OK':
                    duration_in_milleseconds = element['duration']['value']
                    break
                else:
                    break
    except:
        return duration_in_milleseconds

    return duration_in_milleseconds * 1000

# def getLocationInformation(event, context):
#
#     end_placeid = "place_id:ChIJ55fLWVtBkFQR0v31eadEoLM|place_id:ChIJ3S-JXmauEmsRUcIaWtf4MzE"
#     start_placeid = "place_id:ChIJSxh5JbJqkFQRxI1KoO7oZHs"
#     mode = "bicycling"
#     key = "AIzaSyAFcqYxQE7IZjZtZ7tgMt_wb_1ghRCKbXk"
#
#     url = "https://maps.googleapis.com/maps/api/distancematrix/json"
#     params = {"origins":start_placeid,
#               "destinations": end_placeid,
#               "mode":mode,
#               "key": key}
#
#     response = requests.get(url, params)
#
#     if not response.ok:
#         return {'status': 'Error'}
#
#     json_response = json.loads(response.content)
#     if json_response['status'] != 'OK':
#         return {'status': 'Error'}
#
#     print(json_response)
#
#     if json_response is None:
#         return {'status': 'Error'}
#
#
#     result = []
#
#     if 'rows' not in  json_response or len(json_response['rows']) == 0:
#         return  None
#
#     for row in json_response['rows']:
#         if 'elements' not in row or len(row['elements']) == 0:
#             continue
#         for element in row['elements']:
#             elem = {}
#             if element['status'] == 'OK':
#                 elem['status'] = 'Ok'
#                 elem['distance_text'] = element['distance']['text']
#                 elem['distance_value'] = element['distance']['value']
#                 elem['duration_text'] = element['duration']['text']
#                 elem['duration_value'] = element['duration']['value']
#             else:
#                 elem['status'] = 'Error'
#             result.append(elem)
#
#     return {'status': 'Ok' , "result":result}

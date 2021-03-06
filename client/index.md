
@@TOC@@

## Introduction

The Qualisys Track Manager software is used to collect and process motion capture
data from Qualisys motion capture cameras. The software is running under Windows
and offers both post-processing and real-time processing functionality.
The processed real-time data can be retrieved from QTM over a TCP/IP (or UDP/IP)
connection in real-time. This document describes the protocol used in such a
connection.


### Protocol version

This document describes version {{ version }} of the QTM RT server protocol.


### Standard

QTM is backwards compatible with all previous versions of the protocol. The QTM RT
server keeps track of the protocol version used by each RT client connected to it, and
adapts the data to be sent to each client according to their selected protocol version.  

To ensure that a particular client will work with all future releases of QTM, the client
only needs to send the `Version` command to the QTM RT server when connecting to it.  

At the end of this document there is a [list of the changes](#changelog) that
have been made to the protocol between different versions.


### Open sound control

Version 1.6 and later of the QTM RT server protocol supports the *OSC (Open Sound
Control)* protocol over UDP. Connecting to the RT server when using OSC, differs from
the standard version of the RT protocol. See [Connecting](#connecting).

## Overview

### Protocol details

#### Standards used
The QTM RT server should be able to communicate successfully with clients from
any computer architecture. To avoid problems, check the points below.

#### Byte order
The byte order of data pieces larger than one byte can differ between computer
architectures. Select the byte-order your computer architecture prefers by
connecting to the corresponding TCP/IP port on the QTM RT server. See [IP port numbers](#ip-port-numbers).

#### Floating point values
The floating point type used by the QTM RT server is the standard defined by
IEEE 754. Single precision floats (32-bit) values are used.

### Auto discover

It is possible to auto discover any computers running QTM version 2.4 (build 551) or
later on your local area network. This is done by broadcasting an UDP packet to the
QTM auto discover port, see [IP port numbers](#ip-port-numbers). The discover packet shall contain the port number to
which QTM sends an UDP response string, see [Discover packet](#discover-packet). Except for the IP address,
the client will also respond with the host name, QTM version and number of
connected cameras.


### Connecting

Connecting to the QTM RT server is simply a matter of connecting to a specific
TCP/IP port on the computer where QTM is running.

The first thing that happens when you have connected to the QTM RT server is
that the server sends a welcome message string:

```
QTM RT Interface connected.
```

Number of simultaneous connections is limited to 10. If the limit is reached
while connecting, QTM will respond with an error message:

```
Connection refused. Max number of clients reached.
```

The first command that the client should send to the server is the `Version`
command, to make sure that QTM is using the RT protocol version expected by the
client. If the client doesn&rsquo;t send the `Version` command, QTM will use version
1.1.

If the client will request streaming data over TCP/IP (default) or polled data,
make sure to disable **Nagle's algorithm** for the TCP/IP port. See [Disabling Nagle's algorithm](#disabling-nagle-39-s-algorithm).


#### Disabling Nagle's algorithm

The TCP protocol by default uses a performance improvement called Nagle's
algorithm that reduces the bandwidth used by the TCP connection. In the case of
a real-time server that sends small amounts of data in each frame, this
algorithm should be turned off. Otherwise the server (and client) will wait to
fill a full TCP packet, or until the previous packet has been acknowledged by
the receiver, before sending it to the client (or the server).

On the Windows platform, Nagle's algorithm can be turned off by enabling the
**TCP_NODELAY** option for the TCP/IP port.

If you use UDP/IP streaming only (via the `StreamFrames` command), it is *not*
necessary to turn off Nagle's algorithm for the TCP/IP port, since a little
higher latency can be accepted in the parts of the protocol that do not stream
data in real-time. The UDP streaming protocol has no such bandwidth
optimization and is designed for low latency-applications.

#### IP port numbers

In the **RT output** tab of the Workspace Options dialog in QTM, you can
configure the QTM RT server ports.

You can only edit the base port (**22222** by default). This is is the legacy
server port, for version 1.0 of the protocol. All other ports except for the
auto discover port are set from the base port. See table below.

| Port           | Default | Description                              |
| -------------- | ------- | -----------------------------------------|
| Base port - 1  | 22221   | Telnet port. Used mainly for testing. Connects to the latest version of the RT protocol.                    |
| Base port      | 22222   | Supports only the 1.0 version of the protocol. **Don&rsquo;t use this port for any new clients.**         |
| Base port + 1  | 22223   | Little-endian version of the protocol. Used from protocol version 1.1 and onwards.                                |
| Base port + 2  | 22224   | Big-endian version of the protocol. Used from protocol version 1.1 and onwards.                                |
| Base port + 3  | 22225   | QTM RT-protocol over OSC (Open Sound Control) protocol. OSC protocol is sent over UDP.                     |
| 22226          | 22226   | QTM auto discover. QTM listens for UDP discover broadcasts on this port and responds with an UDP message to the sender.                                                               |


### Protocol structure

All data sent between the server and the client is packaged in packets with an
**8-byte** header consisting of a **4&#8209;byte&nbsp;Size** field and a
**4&#8209;byte&nbsp;Type** field. 

In most cases, the QTM RT server does not send any data to the client unless
requested. The client sends a command and the QTM RT server sends a response in
form of a string or XML data or frame data. The client should however be able
to handle cases when packets arrive which is not a response to a command. For
example, an [event](#event-packet) or an [error](#error-packet) message
could arrive when a completely different response is expected. 

### Retrieving settings

Before requesting streamed data, it may be necessary to ask QTM about different
settings, for example what frequency the system is capturing in and what labels
the labeled markers have. For all such information that does not change with
each frame, the command `GetParameters` is used. QTM replies with an XML data
string packat, that the client should parse and extract the required data from.
See [XML packet](#xml-packet).

### Change settings

It is possible to change some of the QTM settings via the RT server. This is
done by sending an [XML data packet](#xml-packet), containing the settings to be
changed. Settings that are possible to change are:
[General](#general-settings), [Image](#image-settings) and
[Force](#force-settings),

If the settings were updated ok, the server will send a command string response:

```
Setting parameters succeeded
```

Otherwise a error string will be sent:

```
Setting parameters failed
```

*Change settings is not available with the OSC protocol*.

#### General settings

##### Frequency

The Frequency setting tells QTM how long a capture started with the
*start* command shall be. The time is expressed in seconds.

##### Capture\_Time

The Capture\_Time setting tells QTM how long a capture started with the
*start* command shall be. The time is expressed in seconds.

##### Start_On_External_Trigger

The `Start_On_External_Trigger` setting tells QTM if the measurement shall
start on external trigger. The value can be true or false. Legacy parameter
that for oqus is the trigger input but for the Miqus Sync Unit specifies any
of the Trig NO or Trig NC ports.

##### Start_On_Trigger_NO

The `Start_On_Trigger_NO` setting tells QTM if the measurement shall start on
external trigger signal from Miqus Sync Unit Trig NO port or the Oqus trigger
input. The value can be true or false.

##### Start_On_Trigger_NC

The `Start_On_Trigger_NC` setting tells QTM if the measurement shall start on
external trigger signal from Miqus Sync Unit Trig NC port. The value can be
true or false.

##### Start_On_Trigger_Software
The `Start_On_Trigger_Software` setting tells QTM if the measurement shall
start on external trigger signal from a software trigger. It can be devices
and applications like keyboard, RT clients, telnet command etc. The value can
be true or false.

##### External\_Time\_Base

* **Enabled** 
   Enable or disable external time base. Value can be True or False.

* **Signal\_Source** 
Signal source used for external time base. Selectable values:
   * Control port
   * IR receiver
   * SMPTE
   * IRIG
   * Video sync

* **Signal\_Mode** 
Selectable values:
  * Periodic
  * Non-periodic

* **Frequency\_Multiplier** 
  Multiply incoming frequency by this integer to
  get the camera frequency. Can be combined with frequency divisor. Value is an
integer.
  
* **Frequency\_Divisor** 
  Divide incoming frequency by this integer to get the
  camera frequency. Can be combined with frequency multiplier. Value is an
integer.
  
* **Frequency\_Tolerance** 
  Frequency tolerance in ppm of period time. Value
is an integer. 
  
* **Nominal\_Frequency** 
  Nominal frequency used by QTM. To disable nominal
  frequency set the value to *None.* To enable nominal frequency set a float
value.
  
* **Signal\_Edge** 
Control port TTL signal edge.
  * Negative
  * Positive

* **Signal\_Shutter\_Delay** 
  Delay from signal to shutter opening in micro
seconds. Value is an integer.
  
* **Non\_Periodic\_Timeout** 
  Max number of seconds expected between two
  frames in non-periodic mode. Value is a float.

##### Processing_Actions
- **PreProcessing2D**  
  Enable or disable 2D pre-processing action. Value can be True or False.
- **Tracking**  
  2D or 3D tracking processing action. Value can be 2D, 3D or False.
- **TwinSystemMerge**  
  Twin system merge processing action. Value can be True or False.
- **SplineFill**  
  Spline fill processing action. Value can be True or False.
- **AIM**  
  AIM processing action. Value can be True or False.
- **Track6DOF**  
  6 DOF tracking processing action. Value can be True or False.
- **ForceData**  
  Force data processing action. Value can be True or False.
- **GazeVector**  
  Enable or disable gaze vector data processing action. Value can be True or False.
- **SkeletonSolve**  
  Enable or disable skeleton data processing action. Value can be True or False.
- **ExportTSV**  
  Export to TSV processing action. Value can be True or False.
- **ExportC3D**  
  Export to C3D processing action. Value can be True or False.
- **ExportMatlabFile**  
  Export to MATLAB file processing action. Value can be True or False.
- **ExportAviFile**  
  Enable or disable export to AVI video file processing action. Value can be True or False.

##### RealTime_Processing_Actions
- **PreProcessing2D**  
  Enable or disable 2D pre-processing action. Value can be True or False.

- **Tracking**  
  2D or 3D tracking processing action. Value can be 2D, 3D or False.
- **AIM**  
  AIM processing action. Value can be True or False.
- **Track6DOF**  
  6 DOF tracking processing action. Value can be True or False.
- **ForceData**  
  Force data processing action. Value can be True or False.
- **GazeVector**  
  Enable or disable gaze vector data processing action. Value can be True or False.
- **SkeletonSolve**  
  Enable or disable skeleton data processing action. Value can be True or False.
- **ExportTSV**  
  Export to TSV processing action. Value can be True or False.
- **ExportC3D**  
  Export to C3D processing action. Value can be True or False.
- **ExportMatlabFile**  
  Export to MATLAB file processing action. Value can be True or False.
- **ExportAviFile**  
  Enable or disable export to AVI video file processing action. Value can be True or False.
- **ExportFBX**  
Enable or disable export to FBX processing action. Value can be True or False.

##### Reprocessing_Actions
- **PreProcessing2D**  
    Enable or disable 2D pre-processing action. Value can be True or False.

- **Tracking**  
  2D or 3D tracking processing action. Value can be 2D, 3D or False.
- **TwinSystemMerge**  
  Twin system merge processing action. Value can be True or False.
- **SplineFill**  
  Spline fill processing action. Value can be True or False.
- **AIM**  
  AIM processing action. Value can be True or False.
- **Track6DOF**  
  6 DOF tracking processing action. Value can be True or False.
- **ForceData**  
  Force data processing action. Value can be True or False.
- **GazeVector**  
  Enable or disable gaze vector data processing action. Value can be True or False.
- **SkeletonSolve**  
  Enable or disable skeleton data processing action. Value can be True or False.
- **ExportTSV**  
  Export to TSV processing action. Value can be True or False.
- **ExportC3D**  
  Export to C3D processing action. Value can be True or False.
- **ExportMatlabFile**  
  Export to MATLAB file processing action. Value can be True or False.
- **ExportAviFile**  
  Enable or disable export to AVI video file processing action. Value can be True or False.
- **ExportFBX**  
Enable or disable export to FBX processing action. Value can be True or False.

##### Camera

General settings consist of none or several *Camera* elements, with
following content.

* **ID**  
Select camera to which the settings shall apply. If the camera id is set to a negative value, settings will apply to all cameras. This value must always be present.  

* **Mode**  
Changes camera mode for selected camera. Available camera modes are:

  * Marker 
  * Marker Intensity
  * Video

* **Video_Resolution**  
Change video resolution for non-marker cameras (Oqus 2c and Miqus Video). Available resolutions are:

  * 1080p
  * 720p 
  * 540p 
  * 480p

* **Video_Aspect_Ratio**  
Change video aspect ratio for non-marker cameras (Oqus 2c and Miqus Video). Available aspect ratios are:
  * 16x9
  * 4x3
  * 1x1
  
* **Video\_Frequency**  
Set video capture frequency for the camera selected by Camera ID, see above. The value is either in Hz ( >1 Hz) or in percent of max frequency (0.0 to 1.0), 32-bit float.
Note: It is only possible to set minimum video capture frequency, which is 1 Hz, by setting the Video_Frequency setting to 0 (0%).

* **Video\_Exposure**  
Set video exposure time for the camera selected by Camera ID, see above. The
value is either in micro seconds ( \>&nbsp;5&nbsp;&micro;s) or in percent of
max value (0.0 to 1.0), 32-bit float.

* **Video\_Flash\_Time**  
Set video flash time for the camera selected by Camera ID, see above. The
value is either in micro seconds ( \>&nbsp;5&nbsp;&micro;s) or in percent of
max value (0.0 to 1.0), 32-bit float.

* **Marker\_Exposure**  
Set marker exposure time for the camera selected by Camera ID, see above. The
value is either in micro seconds ( \>&nbsp;5&nbsp;&micro;s) or in percent of
max value (0.0 to 1.0), 32-bit float.

* **Marker\_Threshold**  
Set marker threshold for the camera selected by Camera ID, see above. The
value is either an absolute value (50&nbsp;-&nbsp;900) or in percent of max
value (0.0 to 1.0), 32-bit float.

* **Orientation**  
Set camera orientation for the camera selected by Camera ID, see above. The
setting affects the 2D camera view in QTM. The value is in degrees (0, 90,
180 or 270), 32-bit integer.

* **Sync_Out/Sync_Out2**  
Camera settings consist of none or one *Sync_Out*, or one *Sync_Out2*
element, with following content:

  * **Mode**  
  Synchronization mode for the selected camera. Available modes:

    * Shutter out 
    * Multiplier
    * Divisor
    * Camera independent
    * Measurement time
    * Continuous 100Hz

  * **Value**  
  This integer value is only used for three of the sync out modes. The
  content is different depending on the *Mode* setting.

    * **Multiplier** - Multiplier applied to the camera frequency
    * **Divisor** -  Divisor applied to the camera frequency
    * **Camera** - independent Camera independent frequency

  * **Duty_Cycle** 
  Output duty cycle in per cent (float). Only used in multiplier, divisor and
  camera independent mode.

  * **Signal\_Polarity**  
  TTL signal polarity. Possible values:

    * Positive
    * Negative


* **Sync_Out_MT**  
Camera settings consist of none or one *Sync_Out_MT* element, with following
content:
  
  * **Signal_Polarity**  
    TTL signal polarity. Not used in Continuous 100Hz mode. Possible values:

    * Positive
    * Negative


* **LensControl**  
Camera settings consist of none or one LensControl element (will only be
available for cameras that support lens control), with following content:

  * Focus
   Camera lens control focus settings. Below are the attributes used, all as 32-bit float values.

    * Value
    Current lens control focus value.

    * Min
    Minimum lens control focus value.

    * Max
    Maximum lens control focus attribute.

  * Aperture
  Camera lens control aperture settings. Below are the attributes used, all as 32-bit float values.

    * Value
    Current lens control aperture value.

    * Min
    Minimum lens control aperture value.

    * Max
    Maximum lens control focus attribute.


 * **AutoExposure**
   Camera settings consist of none or one `AutoExposure` element (will only be
   available for cameras that support auto exposure), with following
   attributes. Enabled (true/false) and Compensation (current auto exposure
   compensation value).

 * **AutoWhiteBalance**
   Camera settings consist of none or one `AutoWhiteBalance` element. (will only be
   av ailable for cameras that support auto white balance). Setting can be True or False.

#### Image settings

The *Image* element in the XML data packet consists of none or several
*Camera* elements. The image settings are used to request streaming
images from one or several cameras.

##### Camera

The settings within a *Camera* element must come in a predefined order, see
below and [Settings example](#settings-example). All settings can be set
individually, except for ID, which always has to be present.  If the selected
camera is not enabled since before, the default values will be used for all
image settings that are not present in the *Camera*element. Otherwise current
image settings will be used.

* **ID**  
Select camera to fetch images from. This value must always be present in the
image settings.

* **Enabled**  
Enable or disable transmission of image data from camera selected by Camera
ID, see above. True or False

* **Format**  
Available image formats.

  * RAWGrayscale 
  * RAWBGR
  * JPG (Default)
  * PNG

* **Width**  
Width of the requested image. This does not take into account the cropping.
The width is the dimensions had the image not been cropped at all. 32-bit
integer.

* **Height**  
Height of the requested image. This does not take into account the cropping.
The height is the dimensions had the image not been cropped at all. 32-bit
integer.

* **Left\_Crop**  
Position of the requested image left edge relative the original image. 32-bit
float.

  * 0.0 = Original image left edge (Default).
  * 1.0 = Original image right edge.

* **Top\_Crop**  
Position of requested image top edge relative the original image. 32-bit
float.

  * 0.0 = Original image top edge (Default).  
  * 1.0 = Original image bottom edge.

* **Right\_Crop**  
Position of requested image right edge relative the original image. 32-bit
float.

  * 0.0 = Original image left edge.
  * 1.0 = Original image right edge (Default).

* **Bottom\_Crop**  
Position of requested image bottom edge relative the original image. 32-bit
float.

  * 0.0 = Original image top edge.
  * 1.0 = Original image bottom edge (Default).

#### Force settings

The Force section in the XML data packet consists of none or several
*Plate* elements. 

**Plate**
Each *Plate* element consists of a *Force\_Plate\_Index* and a *Location*
element. The settings within a plate element must come in a predefined order,
see [Settings example](#settings-example).

* **Force\_ID**  
ID of camera to fetch images from. This value must always be present in the
image settings.

* **Location**  
The *Location* element consists of four corner elements: *Corner1*,
*Corner2*, *Corner3* and *Corner4*. Each corner element consists of X, Y and Z
*elements with the coordinates for the force plate (32 bit floats).

#### Settings example
Send the following XML data packet to the RT server:

{{> settings_example }}

Response: 
```
Setting parameters succeeded
```

or

```
Setting parameters failed
```

### Streaming data
The client has two options when requesting data frames from the QTM RT
server: polling mode or streaming mode. 

In polling mode, the client requests each frame in the pace it needs
them, using the command *GetCurrentFrame*. 

In streaming mode, the client tells QTM to stream data at a fixed rate
to the client by using the *StreamFrames* command. QTM keeps streaming
data until the measurement is stopped in QTM or the client tells QTM to
stop. 

In either mode, the client decides what type of data it needs (2D, 3D,
6D, Analog, Force or a combination of these). 

In streaming mode, the client may request streaming over UDP/IP instead
of TCP/IP, to minimize the protocol latency (at the cost of possibly
losing some data frames). When using the OSC protocol, all data is sent
via UDP. 


## Commands

In the description of the commands, number parameters are designated by an `n`,
optional parameters are designated by enclosing brackets `[ ]` and choices between
possible values are designated by a `|`. Parentheses are used to group
parameters together. None of these characters, ie brackets `[ ]`, the pipe
character `|` or parentheses `()` should be included in the command sent to the
server. 

Command strings and their parameters never contain spaces, so a space character
(ASCII 32) is used as separator between command names and parameters.

Command strings and parameter strings are case insensitive.

The response to a command is a command packet, error packet, XML packet, C3D
data packet or QTM data packet. Each command below has an example. The
examples list all available responses for each command. Command strings and
error strings are shown in italic. If the command is not recognized by the
server, it will send an error response with the string **Parse Error**.

| Command         | Parameters                                                   |
| --------------- | ------------------------------------------------------------ |
| Version         | `[n.n]`                                                      |
| QTMVersion      |                                                              |
| ByteOrder       |                                                              |
| GetState        |                                                              |
| GetParameters   | `All` &#124; `([General] [3D] [6D] [Analog] [Force] [Image] [GazeVector] [Skeleton])` |
| GetCurrentFrame | `[2D] [2DLin] [3D] [3DRes] [3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]]` |
| StreamFrames    | `Stop` &#124; `((FrequencyDivisor:n` &#124; `Frequency:n` &#124; `AllFrames) [UDP[:address]:port] ([2D] [2DLin] [3D] [3DRes][3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]]))` |
| TakeControl     | `[Password]`                                                 |
| ReleaseControl  |                                                              |
| New             |                                                              |
| Close           |                                                              |
| Start           | `[RTFromFile]`                                               |
| Stop            |                                                              |
| Load            | `Filename`                                                   |
| Save            | `Filename [Overwrite]`                                       |
| LoadProject     | `ProjectPath`                                                |
| GetCaptureC3D   |                                                              |
| GetCaptureQTM   |                                                              |
| Trig            |                                                              |
| SetQTMEvent     | `Label`                                                      |
| Reprocess       |                                                              |
| Led             | `Camera (On` &#124; `Off` &#124; `Pulsing) (Green`&#124;`Amber`&#124;`All)` |
| Quit            |                                                              |

### Version

> **`Version`** `[n.n]`

The first thing that a client should do after connecting to the QTM RT server is to send the Version command to the server with the desired protocol version. This will ensure that the protocol described in this document is followed by the server. The server will respond with Version set to n.n, where n.n is the
version selected. If no argument is used, the server will respond with the current version.

If you don't set the protocol version yourself, QTM will set it to **version 1.1** by default.

###### Example:
```coffeescript
Command:    Version {{ version }}
Response:   Version set to {{ version }}    or  
			Version NOT supported

Command:    Version
Response:   Version is {{ version }}
```

### QTMVersion
> **`QTMVersion`**

Returns the QTM version on which the RT server is running.

###### Example:
```coffeescript
Command:    QTMVersion
Response:   QTM Version is 2.3 (build 464)
```

### ByteOrder
> **`ByteOrder`**

Returns the current byte order.

###### Example:
```coffeescript
Command:    ByteOrder
Response:   Byte order is little endian or
            Byte order is big endian
```

### GetState
> **`GetState`**

This command makes the RT server send current QTM state as an event data
packet. The event packet will only be sent to the client that sent the GetState
command. If the client is connected via Telnet, then the response will be sent
as an ASCII string. `GetState` will not show the **Camera Settings Changed**,
**QTM Shutting Down** and **Capture Saved events**.

###### Example:
```coffeescript
Command:    GetState
Response:   'Event packet with last QTM event.'
```

### GetParameters
> **`GetParameters`** `All | ([General] [3D] [6D] [Analog] [Force] [Image] [GazeVector] [Skeleton[:global]])`

This command retrieves the settings for the requested component(s) of QTM in
XML format. The XML parameters are described [here](#xml-packet).

By default, skeleton data is in local coordinates. Skeleton:global will change the skeleton data to global coordinates

###### Example:
```coffeescript
Command:    GetParameters 3D Force
Response:   Parameters not available                     or
            'XML packet containing requested parameters'
```

### GetCurrentFrame
> **`GetCurrentFrame`** `[2D] [2DLin] [3D] [3DRes] [3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]]`

<div class="well">The optional channels for Analog and AnalogSingle, is a
string containing a list of channels to read from the server. The channels
are separated by a `,` and can also contain ranges defined by a `-`. Here is
an example: `1,2,3-6,16`</div>

By default, skeleton data is in local coordinates. Skeleton:global will change the skeleton data to global coordinates.

This command returns the current frame of real-time data from the server.  

Points worth noting are:  
* The frame is composed of the parts specified in the parameters to the
  command. The exact layout of the data frame in different situations is
  described in [Data packet](#data-packet). 

* The composition of the data frame may vary between frames. This is due to the
  fact that some data (Analog and Force data) is not collected or buffered at
  the same rate as the camera data (**2D**, **3D**, **6D**). If you specify
  Analog or Force data to be streamed together with some form(s) of camera
  data, some data frames may include analog while others don't include it. This
  is because QTM sends the Analog and Force data as soon as it is available,
  and it is usually available in fairly large chunks and not as often as camera
  data is available

* If there is no ongoing measurement (either it has not started or it has
  already finished), an [empty data frame](#no-more-data-packet) is sent to the
  client .

* If a measurement is ongoing but there is no new frame of data available, the
  server waits until the next frame of data is available before sending it to
  the client.

###### Example:
```coffeescript
Command:    GetCurrentFrame 3D Analog
Response:   'A data frame is sent to the client, containing all requested data
             components.'
```

### StreamFrames
> **`StreamFrames`** `Stop | ((FrequencyDivisor:n | Frequency:n | AllFrames) [UDP[:address]:port] [2D] [2DLin] [3D] [3DRes] [3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]])`

<div class="well">The optional channels for Analog and AnalogSingle, is a
string containing a list of channels to read from the server. The channels
are separated by a `,` and can also contain ranges defined by a `-`. Here
is an example: `1,2,3-6,16`</div>

By default, skeleton data is in local coordinates. Skeleton:global will change the skeleton data to global coordinates.

This command makes the QTM RT server start streaming data frames in real-time.  

Points worth noting are:
* Each frame is composed of the parts specified in the parameters to the
  command. The exact layout of the data frame in different situations is
  described in [Data packet](#data-packet).

  The composition of the data frame may vary between frames. This is due to the
  fact that some data (Analog and Force data) is not collected or buffered at
  the same rate as the camera data (2D, 3D, 6D). If you specify Analog or Force
  data to be streamed together with some form(s) of camera data, some data
  frames may include analog while others don't include it. This is
  because QTM sends the Analog and Force data as soon as it is available, and
  it is usually available in fairly large chunks and not as often as camera
  data is available

* If there is no ongoing measurement (either it has not started or it has
  already finished), an [empty data frame](#no-more-data-packet) is sent to the
  client.

* The actual rate at which the frames are sent depends on several factors
  &ndash; not just the frequency specified in the command parameters:

  * **The measurement frequency** used when acquiring the camera data (2D, 3D,
    6D).  The transmission rate cannot be greater than this frequency.

  * **The real-time processing frequency set** in QTM. This may differ greatly
    from the measurement frequency. For example QTM may be measuring at 1000 Hz
    but trying to calculate real-time frames only at 50Hz. The transmission
    rate cannot be greater than this frequency either.

  * **The processing time** needed for each frame of data in QTM. 
  This may also be a limiting factor – QTM may not have time to process and
  transmit frames at the rate specified as the real-time processing
  frequency.

  * **The frequency specified by the client in the command parameters**.  
  The client has three ways of specifying the preferred data rate of the
  server. If the client specifies a higher rate than it can receive and
  handle in real-time, buffering will occur in the TCP/IP or UDP/IP stack at
  the client side and the client will experience lagging. 

   * **FrequencyDivisor:n**  
     With this setting, QTM transmits every n:th processed real-time frame to
     the client. Please note that this may not be the same as every n:th frame
     of the measurement (see real-time processing frequency above).  

     *Example*: QTM is measuring in 200 Hz and real-time tracking in 100 Hz.
     If a client specifies FrequencyDivisor:4 QTM will send data at a rate of
     25Hz. 

    * **Frequency:n**  
      With a specific frequency setting, the QTM RT server will transmit frames
      at a rate of approximately n Hz.  

    *Example*: QTM is measuring in 200 Hz and real-time tracking in 100 Hz.
    If a client specifies Frequency:60 QTM will send data at an approximate
    rate of 60Hz. This means that usually every other processed frame is
    transmitted, but once in a while two frames in a row are transmitted (to
    reach 60Hz instead of 50). 

    * **AllFrames**  
      When a client specifies AllFrames in the StreamFrames command, every
      real-time frame processed by QTM is transmitted to the client.  

* UDP notes:

  * If the UDP argument is present, the server will send the data frames over
    UDP/IP instead of TCP/IP. With high network load the risk of losing packets
    increases. When using TCP/IP, these packets will be retransmitted and no
    packets will be lost, but on the other hand, when packets are lost the
    client will not receive any data until they have been retransmitted, which
    can take up to a second in some cases.  

    When using UDP/IP, lost packets are lost, but the next transmitted packet
    will not be delayed by waiting for retransmissions, so the latency can be a
    lot better using UDP/IP. 

  * The address parameter is optional. If omitted, the UDP frames will be sent
    to the IP address that the command is sent from (the IP address of the
    client). 

  * The port parameter is not optional. Valid port numbers are 1023 – 65535.

  * When using UDP one cannot be sure that all components are sent in a single
    data frame packet. It can be divided into several data frame packets. The
    server will try to fit as many components into one UDP datagram as
    possible. 

* When the measurement is finished, or has not yet started, a special
  [empty data frame](#no-more-data-packet) packet signaling that no data is
  available is sent to the client.

* To stop the data stream before it has reached the end of the measurement or
  to prevent data from being sent if a new measurement is started after the
  first was finished: send the StreamFrames Stop command.


###### Example:
```coffeescript
Command:    StreamFrames Frequency:30 UDP:2234 3D Analog
Response:   '30 data packets per second containing 3D data and Analog data are streamed
             over UDP to port 2234 of the client computer.'
```

### TakeControl
> **`TakeControl`** `[Password]`

This command is used to take control over the QTM RT interface. Only one client
can have the control at a time. Once a user has the control, it is possible to
change settings, create a new measurement, close measurement, start capture,
stop capture and get a capture. The password argument is optional and is only
needed if it is required by QTM. QTM can be configured to deny all clients
control, only allow clients with correct password or allow all clients control.

###### Example:
```coffeescript
Command:    TakeControl x364k6Gt
Response:   You are now master                    or
            You are already master                or
            127.0.0.1 (1832) is already master    or
            Client control disabled in QTM        or
            Wrong or missing password
```

### ReleaseControl
Release the control over the QTM RT interface, so that another client can take
over the control.

###### Example:
```coffeescript
Command:    ReleaseControl
Response:   You are now a regular client       or
            You are already a regular client
```

### New

This command will create a new measurement in QTM, connect to the cameras and
enter RT (preview) mode. It is only possible to issue this command if you have
the control over the QTM RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    New
Response:   Creating new connection                                  or
            Already connected                                        or
            The previous measurement has not been saved or closed    or
            You must be master to issue this command
```

### Close

This command will close the current QTM measurement. If in RT (preview) mode,
it will disconnect from the cameras end exit RT (preview) mode. Otherwise it
will close any open QTM measurement file. If the measurement isn’t saved, all
data will be lost. If QTM is running RT from file, the playback will stop and
the file will be closed. It is only possible to issue this command if you have
the control over the QTM RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Close
Response:   Closing connection                          or
            Closing file                                or
            No connection to close                      or
            You must be master to issue this command
```

### Start
> **`Start`** `[RTFromFile]`

This command will start a new capture. If the argument RTFromFile is used, QTM
will start streaming real-time data from current QTM file. If there is any file
open. It is only possible to issue this command if you have the control over
the QTM RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Start
Response:   Starting measurement                         or
            Measurement is already running               or
            Not connected. Create connection with new    or
            Starting RT from file                        or
            RT from file already running                 or
            No file open                                 or
            You must be master to issue this command
```

### Stop

This command will stop an ongoing capture or playback of RT from file. It is
only possible to issue this command if you have the control over the QTM RT
interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Stop
Response:   Stopping measurement                         or
            No measurement is running                    or
            Parse error                                  or
            You must be master to issue this command
```

### Load
> **`Load`** `Filename`

**Filename**: A string containing the name of the QTM file to load. If the
filename doesn’t end with “.qtm”, it will be added to the end of the filename.
The file name can be a relative or absolute path. See below.

This command will load a measurement from file. The name of the file is given
in the argument. The file name can be relative or absolute. If the file name is
relative, QTM will try to find the file in the data folder located in the
project folder. If the file doesn’t exist, current measurement isn’t saved or
an active camera connection exists, the measurement will not load.

It is only possible to issue this command if you have the control over the QTM
RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Load
Response:   Measurement loaded                          or
            Missing file name                           or
            Failed to load measurement                  or
            Active camera connection exists             or
            Current measurement not saved               or
            Parse error                                 or
            You must be master to issue this command
```

### Save
> **`Save`** `Filename [Overwrite]`

**Filename**: A string containing the name of the file to save the current
measurement to. If the filename doesn’t end with “.qtm”, it will be added to
the end of the filename. The file name can be a relative or absolute path. See
below.

**Overwrite**: If this parameter is present, an existing measurement with the same
name will be overwritten. Otherwise a file exists error response will be sent.
This parameter is optional. 

This command will save the current measurement to file. The name of the file is
given in the argument. The file name can be relative or absolute. If the file
name is relative, QTM will save the file in the data folder located in the
project folder. If the file already exists, it will be overwritten if the
Overwrite parameter is present. Otherwise a counter will be added to the end of
the file name (_##). If the filename includes spaces, the whole filename should be
enclosed by quotation marks.

It is only possible to issue this command if you have the control over the QTM
RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Save
Response:   Measurement saved                                   or
            Measurement saved as 'new filename with counter'    or
            Failed to save measurement                          or
            No write access.                                    or
            Failed to create directory                          or
            No measurement to save                              or
            You must be master to issue this command
```

### LoadProject
> **`LoadProject`** `ProjectPath`

**ProjectPath**: A string containing the path of the project to load.

This command will load a project, given a project path. If the path doesn’t
exist, current measurement isn’t saved or an active camera connection exists,
the project will not load. C:\Users\lnn\QTM files\Imagination

It is only possible to issue this command if you have the control over the QTM
RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Load
Response:   Project loaded                             or
            Missing project name                       or
            Failed to load project                     or
            Active camera connection exists            or
            Current measurement not saved              or
            Parse error                                or
            You must be master to issue this command
```

### GetCaptureC3D
This command will download the latest capture as a C3D file.
If the command is successful, a `Sending capture` response is sent, followed by a C3D file packet containing current capture.

###### Example:
```coffeescript
Command:    GetCapture
Response:   Sending capture   'A C3D packet is sent containing current capture'    or 
            No capture to get                                                      or
            Error sending C3D file
```

### GetCaptureQTM
This command will download the latest capture as a QTM file.
If the command is successful, a `Sending capture` response is sent, followed by a QTM file packet containing current capture.

###### Example:
```coffeescript
Command:    GetCapture
Response:   Sending capture   'A QTM packet is sent containing current capture'    or
            No capture to get                                                      or
            Error sending QTM file
```

### Trig
> **`Trig`**

This command will trig a measurement, if the camera system is set to start on
external trigger. The RT server will send a WaitingForTrigger event when it is
waiting for a trigger. See [Events](#events). It is only possible to issue this command if
you have the control over the QTM RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Trig
Response:   Trig ok                                     or
            QTM not waiting for trig                    or
            You must be master to issue this command
```

### SetQTMEvent
> **`SetQTMEvent`** `Label`

**Label**: A string containing the label name of the event. If no name is
given, the label will be set to “Manual event”.

This command will set an event in QTM. 

###### Example:
```coffeescript
Command:    Event test_event
Response:   Event set                                    or
            Event label too long                         or
            QTM is not capturing                         or
            You must be master to issue this command
```

### Reprocess

This command will reprocess current measurement. It is only possible to issue
this command if you have the control over the QTM RT interface. See [TakeControl](#takecontrol).

###### Example:
```coffeescript
Command:    Reprocess
Response:   Reprocessing file       or
            No file open            or
            RT from file running
```

### Led
> **`Led`** `camera mode color`

**camera**: Number of the Miqus camera to change the LED.

**mode**: This can be one of `On`, `Off` or `Pulsing`.

**color**: This can be one of `Green`, `Amber` or `All`.

This command can turn the leds on a Miqus camera on/off. You can specify if
the Miqus leds should be on, off or pulsing in all or individual colors
(green, amber).

###### Example:
```coffeescript
Command:    Led
Response:   Parse error                                 or
            You must be master to issue this command
```

### Quit
> **`Quit`**

This command ends the current telnet session. The Quit command only works if
you have connected to the RT server on the telnet port. Default telnet port is
22221.

###### Example:
```coffeescript
Command:    Quit
Response:   Bye bye
```

## QTM RT Packets

### Structure

All packets sent to or from the server have the same general layout.

The first part consists of a packet header of 8 bytes:

Bytes | Name     | Type           | Description
----- | -------- | -------------- | -----------
4     | Size     | 32-bit integer | The total size of the QTM RT packet including these four bytes denoting the size.
4     | Type     | 32-bit integer |  The type of data in the packet

After the header follows the actual data of the packet:

Bytes    | Name     | Type  | Description
-------- | -------- | ----- | -----------
Size - 8 | Data     | Mixed | Whatever data that the Type field says it is.


**Please note**:  
A packet sent to or from a QTM RT server is not a type of TCP data packet. TCP
is defined as a data stream. QTM RT server data packets are part of the QTM RT
server protocol defined on top of a TCP stream. When a client reads data from
the TCP/IP stream, it is usually divided into chunks (each probably being sent
in a single TCP/IP packet), but these chunks are not necessarily the same as a
QTM RT server protocol packet. To handle TCP/IP reading properly, first read
four bytes from the stream to see how big the packet is, then read (Size – 4)
bytes from the TCP/IP stream to make sure you have received a whole packet.
Then handle the packet according to its Type member.

#### Packet types
The Type field of a QTM RT server packet header is a number that should be
interpreted according to the table below. These are the data types that are
defined in the protocol so far. Detailed descriptions of the data packets for
each type can be found in the sections following this one.

Type no  | Name                       | Description
---------|----------------------------|------------
0        | Error                      | The last command generated an error. The error message is included in the packet.
1        | Command / Command Response | A command sent to the server or a response from the server to a command indicating that the command was successful.
2        | XML                        | Data sent by the server in the form of XML, or data sent to the server in the form of XML.
3        | Data                       | One sample of real-time data sent from the server. The contents of the frame may vary depending on the commands/settings sent to the server. The contents may also vary between frames due to different sampling frequencies and buffering properties of different data types.
4        | No More Data               | This packet type contains no data. It is a marker used to indicate that a measurement has finished or is not yet started.
5        | C3D file                   | Data sent from the server in form of a C3D file.
6        | Event                      | This packet type contains event data from QTM.
7        | Discover                   | Auto discover packet.
8        | QTM file                   | Data sent from the server in form of a QTM file.

### Error packet
Error messages from the server are sent in an error packet. Whenever you read a response from the server, it may be an error packet instead of the packet type you expect. Command response strings sent from the server are always NULL-terminated.

Example of an error packet:  

Bytes | Name     | Value
----- | -------- | -------
4     | Size     | 31 (8 bytes header + 23 bytes data)
4     | Type     | 0
23    | Data     | "Command not supported."


### Command / Command Response packet
Commands and responses to commands are sent in packets of type 1 (see table
above). Command response strings sent from the server are always NULL-terminated, but NULL-termination is optional for command strings sent from the clients. 

Here is an example of a command sent to the server:

Bytes | Name   | Value
----- | ------ | -----
4     | Size   | 20 (8 bytes header + 12 bytes data)
4     | Type   | 1
12    | Data   | "Version 1.2"

### XML packet
XML is used to exchange parameters between the server and the client. This has
several benefits, including extendibility. Clients should not assume that the
XML sent by the server looks exactly like the examples below - there may be any
number of other items included as well, and there may be differences in
whitespace etc, but if you use a standard XML parser to look for the items you
are interested in this will not be a problem.

The QTM RT client SDK source code includes source code for a free XML parser
(it is actually the same source code used inside QTM to create the XML, so they
should work well together).

XML packets follow the same layout as Command/Response packets and Error
packets.

The packet header is followed by a `NULL`-terminated ASCII string.  Interpret
the string as XML according to the following paragraphs. All XML data strings
sent from the QTM RT server are enclosed by a element named from the version of
the protocol used (``QTM_Parameters_Ver_{{ version }}`` in this version of the
protocol).

When requesting more than one type of parameters at the same time, all of them
are placed in the same `<QTM_Parameters_Ver_{{ version }}>` element. The individual elements may appear in any order inside this element.

Bytes | Name                  | Value
----- | --------------------- | -----
4     | Size                  | 8 bytes header + XML string length
4     | Type                  | 2
      | Data                  | XML string data, NULL terminated.<br>The XML data can consist of one or several of following parameters:<br>[General](#general-xml-parameters), [3D](#3d-xml-parameters), [6D](#6d-xml-parameters), [GazeVector](#GazeVector-xml-parameters), [Analog](#analog-xml-parameters), [Force](#force-xml-parameters) [Image](#image-xml-parameters) and [Skeleton](#Skeleton-xml-parameters). 

#### General XML parameters
In response to the command GetParameters General the QTM RT server will reply
with an XML data packet, containing an element called General. See below for the
format of this element.

**Frequency**  
The QTM capture frequency.

**Capture_Time**  
The length of the QTM capture, started with the start command. The time is expressed in seconds.

**Start_On_External_Trigger**  
Measurement starts on external trigger. The value can be true or false.

**Start_On_Trigger_NO**
The `Start_On_Trigger_NO` setting tells QTM if the measurement shall start on
external trigger signal from Miqus Sync Unit Trig NO port or the Oqus trigger
input. The value can be true or false.

**Start_On_Trigger_NC**
The `Start_On_Trigger_NC` setting tells QTM if the measurement shall start on
external trigger signal from Miqus Sync Unit Trig NC port. The value can be
true or false.

**Start_On_Trigger_Software**
The `Start_On_Trigger_Software` setting tells QTM if the measurement shall
start on external trigger signal from a software trigger. It can be devices
and applications like keyboard, RT clients, telnet command etc. The value can
be true or false.

**External_Time_Base**  
* **Enabled**  
  Enable or disable external time base. Value can be True or False.

* **Signal_Source**   
  Signal source used for external time base. Possible values:
 * Control port
   * IR receiver
   * SMPTE
   * IRIG
   * Video sync  


* **Signal_Mode**  
  Possible values:
  
   * Periodic
   * Non-periodic


* **Frequency_Multiplier**  
Incoming frequency is multiplied by this integer to get the camera frequency.
Can be combined with frequency divisor. Value is an integer.

* **Frequency_Divisor**  
Incoming frequency is divided by this integer to get the camera frequency. Can
be combined with frequency multiplier. Value is an integer.

* **Frequency_Tolerance**  
Frequency tolerance in ppm of period time. Value is an integer. 

* **Nominal_Frequency**  
Nominal frequency used by QTM. If the value is None, nominal frequency is
disabled. Otherwise the value is a float.

* **Signal_Edge**  
Control port TTL signal edge.  
  * Negative
  * Positive


* **Signal_Shutter_Delay**  
Delay from signal to shutter opening in micro seconds. Value is an integer.

* **Non_Periodic_Timeout**  
Max number of seconds expected between two frames in non-periodic mode. Value
is a float.

**Processing_Actions**

- **PreProcessing2D**  
  Enable or disable 2D pre-processing action. Value can be True or False.
- **Tracking**  
  2D or 3D tracking processing action. Value can be 2D, 3D or False.
- **TwinSystemMerge**  
  Twin system merge processing action. Value can be True or False.
- **SplineFill**  
  Spline fill processing action. Value can be True or False.
- **AIM**  
  AIM processing action. Value can be True or False.
- **Track6DOF**  
  6 DOF tracking processing action. Value can be True or False.
- **ForceData**  
  Force data processing action. Value can be True or False.
- **GazeVector**  
  Enable or disable gaze vector data processing action. Value can be True or False.
- **SkeletonSolve**  
  Enable or disable skeleton data processing action. Value can be True or False.
- **ExportTSV**  
  Export to TSV processing action. Value can be True or False.
- **ExportC3D**  
  Export to C3D processing action. Value can be True or False.
- **ExportMatlabFile**  
  Export to MATLAB file processing action. Value can be True or False.
- **ExportAviFile**  
  Enable or disable export to AVI video file processing action. Value can be True or False.

**RealTime_Processing_Actions**

- **PreProcessing2D**  
  Enable or disable 2D pre-processing action. Value can be True or False.
- **Tracking**  
  2D or 3D tracking processing action. Value can be 2D, 3D or False.
- **AIM**  
  AIM processing action. Value can be True or False.
- **Track6DOF**  
  6 DOF tracking processing action. Value can be True or False.
- **ForceData**  
  Force data processing action. Value can be True or False.
- **GazeVector**  
  Enable or disable gaze vector data processing action. Value can be True or False.
- **SkeletonSolve**  
  Enable or disable skeleton data processing action. Value can be True or False.
- **ExportTSV**  
  Export to TSV processing action. Value can be True or False.
- **ExportC3D**  
  Export to C3D processing action. Value can be True or False.
- **ExportMatlabFile**  
  Export to MATLAB file processing action. Value can be True or False.
- **ExportAviFile**  
  Enable or disable export to AVI video file processing action. Value can be True or False.
- **ExportFBX**  
  Enable or disable export to FBX processing action. Value can be True or False.

**Reprocessing_Actions**

- **PreProcessing2D**  
  Enable or disable 2D pre-processing action. Value can be True or False.
- **Tracking**  
  2D or 3D tracking processing action. Value can be 2D, 3D or False.
- **TwinSystemMerge**  
  Twin system merge processing action. Value can be True or False.
- **SplineFill**  
  Spline fill processing action. Value can be True or False.
- **AIM**  
  AIM processing action. Value can be True or False.
- **Track6DOF**  
  6 DOF tracking processing action. Value can be True or False.
- **ForceData**  
  Force data processing action. Value can be True or False.
- **GazeVector**  
  Enable or disable gaze vector data processing action. Value can be True or False.
- **SkeletonSolve**  
  Enable or disable skeleton data processing action. Value can be True or False.
- **ExportTSV**  
  Export to TSV processing action. Value can be True or False.
- **ExportC3D**  
  Export to C3D processing action. Value can be True or False.
- **ExportMatlabFile**  
  Export to MATLAB file processing action. Value can be True or False.
- **ExportAviFile**  
  Enable or disable export to AVI video file processing action. Value can be True or False.
- **ExportFBX**  
  Enable or disable export to FBX processing action. Value can be True or False.

**Camera**  
General settings consist of none or several Camera elements, with following
content:

* **ID**  
  Identity of the camera to which the settings apply.

* **Model**  
Model of selected camera. Available models are:
 * MacReflex
 * ProReflex 120
 * ProReflex 240
 * ProReflex 500
 * ProReflex 1000
 * Oqus 100
 * Oqus 200 C
 * Oqus 300
 * Oqus 300 Plus
 * Oqus 400
 * Oqus 500
 * Oqus 500 Plus
 * Oqus 600 Plus
 * Oqus 700
 * Miqus M1
 * Miqus M3
 * Miqus M5
 * Miqus Sync Unit
 * Miqus Video
 * Miqus Video Color


* **Underwater**  
True if the camera is an underwater camera.

* **Supports_HW_Sync**
True if the camera supports hardware synchronization.

* **Serial**  
Serial number of the selected camera.

* **Mode**  
Camera mode for selected camera. Available camera modes are:
  * Marker
  * Marker Intensity
  * Video


* **Video_Resolution**  
Change video resolution for non-marker cameras (Oqus 2c and Miqus Video).
Available resolutions are:

 * 1080p
 * 720p 
 * 540p 
 * 480p

* **Video_Aspect_Ratio**  
Change video aspect ratio for non-marker cameras (Oqus 2c and Miqus Video).
Available aspect ratios are:
  
  * 16x9
  * 4x3
  * 1x1


* **Video_Frequency**  
Video capture frequency for selected camera

* **Video_Exposure**  
There are three video exposure times for the selected camera. Current value,
min and max value, which sets the boundaries for the exposure time. The values
are in micro seconds.

* **Video_Flash_Time**  
There are three video flash times for the selected camera. Current value, min
and max value, which sets the boundaries for the flash time. The values are in
micro seconds.

* **LensControl**  
Camera settings consist of none or one LensControl element (will only be
available for cameras that support lens control), with following content:

  * Focus
   Camera lens control focus settings. Below are the attributes used, all as 32-bit float values.

    * Value
    Current lens control focus value.

    * Min
    Minimum lens control focus value.

    * Max
    Maximum lens control focus attribute.

  * Aperture
  Camera lens control aperture settings. Below are the attributes used, all as 32-bit float values.

    * Value
    Current lens control aperture value.

    * Min
    Minimum lens control aperture value.

    * Max
    Maximum lens control focus attribute.

* **AutoExposure**
Camera settings consist of none or one `AutoExposure` element (will only be
available for cameras that support auto exposure), with following
attributes. Enabled (true/false) and Compensation (current auto exposure
compensation value).

* **AutoWhiteBalance**
Camera settings consist of none or one `AutoWhiteBalance` element. (will only be
av ailable for cameras that support auto white balance). Setting can be True or False.

* **Marker_Exposure**  
There are three marker exposure times for the selected camera. Current value,
min and max value, which sets the boundaries for the exposure time. The values
are in micro seconds.

* **Marker_Threshold**  
There are three marker threshold values for the selected camera. Current value,
min and max value, which sets the boundaries for the threshold. The values have
no unit.

* **Position**  
Position and rotation for selected camera. The position is expressed in X, Y Z
coordinates. The rotation is presented by a 3x3 rotational matrix, Rot_1_1 ...
Rot_3_3.

* **Orientation**  
 QTM 2D camera view orientation for selected camera. Possible values are: 0,
 90, 180 or 270 degrees.

* **Marker_Res**  
Marker resolution for selected camera. Width and height values are in sub pixels.

* **Video_Res**  
Video resolution for selected camera. Width and height values are in sub pixels.

* **Marker_FOV**  
Marker field of view for selected camera. Left, top, right and bottom
coordinates are in pixels.

* **Video_FOV**  
Video field of view for selected camera. Left, top, right and bottom
coordinates are in pixels.

* **Sync_Out/Sync_Out2**  
Camera settings consist of none or one *Sync_Out*, or one *Sync_Out2*
element, with following content:

  * **Mode**  
  Synchronization mode for the selected camera. Available modes:
    * Shutter out
    * Multiplier
    * Divisor
    * Camera independent
    * Measurement time
    * Continuous 100Hz

  * **Value**  
  Integer value with different content depending on the Mode setting.
    * Shutter out.	- Not used
    * Multiplier	- Multiplier applied to the camera frequency
    * Divisor		- Divisor applied to the camera frequency
    * Camera independent	- Camera independent frequency
    * Measurement time	- Not used
    * Continuous 100Hz	- Not used

  * **Duty_Cycle**  
    Output duty cycle in percent (float). Only used in multiplier, divisor and
    camera independent mode.
  
  * **Signal_Polarity**  
    TTL signal polarity. Not used in Continuous 100Hz mode. Possible values:
    * Positive
    * Negative


* **Sync_Out_MT**  
Camera settings consist of none or one *Sync_Out_MT* element, with following
content:
  
  * **Signal_Polarity**  
    TTL signal polarity. Not used in Continuous 100Hz mode. Possible values:
    * Positive
    * Negative


##### Example:
  {{> general_xml_example }}

#### 3D XML parameters
In response to the command GetParameters 3D the QTM RT server will reply with
an XML data packet, containing an element called `The_3D`. See below for the format
of this element.

*Note*: XML element names can&rsquo;t begin with a number, that&rsquo;s why the element for
3D parameters is called `The_3D`.

* **AxisUpwards**  
  This parameter tells which axis that is pointing upwards in QTM. The value
  can be one of following: +X, +Y, +Z, -X, -Y and -Z.

* **CalibrationTime**  
  This parameter tells the date and time of when the system was last
  calibrated. If the system has no valid calibration the value is empty. The
  calibration date and time is formatted like this: `yyyy.mm.dd hh:mm:ss`.
  Example, "2011.09.23 11:23:11"

* **Labels**  
  Number of labelled trajectories (markers).

* **Label**  
Element containing label information.
  * Name  
  The name of the label (trajectory).

  * RGBColor  
  The color of the label (trajectory), represented by a three byte integer
  value. Bit 0-7 represents red, bit 8-15 represents green and bit 16-23
  represents blue.

* **Bones**  
Element containing bone information.
  * Bone From  
  The name of the label (trajectory) where the bone starts.

  * Bone To  
  The name of the label (trajectory) where the bone ends.

  * Color  
  The color of the bone.

##### Example:
{{> threed_xml_example }}

#### 6D XML parameters
In response to the command GetParameters 3D the QTM RT server will reply with
an XML data packet, containing an element called `The_3D`. See below for the format
of this element.

*Note*: XML element names can&rsquo;t begin with a number, that&rsquo;s why the element for
3D parameters is called The_6D.

* **Bodies**  
  Element containing number of 6DOF bodies.

* **Body**  
  Element containing 6DOF body information.
  
  * Name  
    Element containing the name of the 6DOF body.
    
  * RGBColor  
    Element containing the color of the 6DOF body, represented by a three byte integer value. Bit
    0-7 represents red, bit 8-15 represents green and bit 16-23 represents blue.
    
  * Point
    Element containing information for one of the points that defines the 6DOF body.
    
    * X  
      X-coordinate for point.

    * Y  
      Y-coordinate for point.

    * Z  
      Z-coordinate for point.

    * Virtual  
      Element containing true if marker is virtual, else false.

    * PhysicalId  
      Element containing physical ID of the marker.
  
* **Euler**  
  Element containing 6DOF Euler rotation names.
* First  
    Element containing the name of the first Euler angle.
    
  * Second  
    Element containing the name of the second Euler angle.
    
  * Third  
    Element containing the name of the third Euler angle.


##### Example:
{{> sixd_xml_example }}

#### Gaze vector XML parameters
In response to the command GetParameters GazeVector the QTM RT server will
reply with an XML data packet, containing an element called Gaze_Vector. See below
for the format of this element.

* **Vector**  
  Element containing gaze vector information.
  * Name  
    The name of the gaze vector body.
    
  * Frequency  
    The gaze vector update frequency.

##### Example:
{{> gaze_xml_example }}

#### Analog XML parameters
In response to the command GetParameters Analog the QTM RT server will reply
with XML data packet, containing an element called Analog. See below for the
format of this element.

* **Device**  
  Element containing analog device information.

  * **Device_ID**  
    Unique ID of the analog device. An integer value starting with 1.
  
  * **Device_Name**  
    Analog device name.
  
  * **Channels**  
    Number of analog channels.
  
  * **Frequency**  
    Analog measurement frequency.
  
  * **Unit**  
    Measurement unit.
  
  * **Range**  
    Min and max analog measurement values.
  
  * **Label**  
    Channel name. There shall be as many labels as there are channels.

##### Example:
{{> analog_xml_example }}

#### Force XML parameters
In response to the command `GetParameters Force` the QTM RT server will reply
with XML data packet, containing an element called Force. See below for the format
of this element.

* **Unit_Length**  
  Length unit used in the Force XML element.

* **Unit_Force**  
  Force unit used in the Force XML element.

* **Plate**  
  Element containing force plate information.

  * **Plate_ID**  
    Unique ID of the force plate. An integer value starting with 1.
  
  * **Analog_Device_ID**  
    ID of the analog device connected to the force plate. If the ID is 0, there
    is no analog device associated with this force plate.
  
  * **Frequency**  
    Measurement frequency of the analog device connected to the force plate.
  
  * **Type**  
    Force plate type. Supported force plates:
  AMTI, AMTI 8 Channels, Bertec, Kistler and QMH.
  
  * **Name**  
    Force plate name.
  
  * **Length**  
    Force plate length.
  
  * **Width**  
    Force plate width.
  
  * **Location**  
    Element containing four elements with the corners of the force plate. Corner1,
    Corner2, Corner3 and Corner4. Each corner has an X, Y and Z coordinate value.
  
  * **Origin**  
    Element containing X, Y and Z coordinates for the force plate origin.
  
  * **Channels**  
    Element containing elements called Channel. One for each analog channel connected
    to the force plate. Each Channel contains Channel_No and ConversionFactor.
  
  * **Calibration_Matrix**  
    Element containing a 6x6, 6x8 or 12x12 calibration matrix for the force plate.
  
  ##### Example:

{{> force_xml_example }}

The parameters for force plates follow roughly the standard of the [C3D file
format](http://www.c3d.org). 

#### Image XML parameters
In response to the command GetParameters Image the QTM RT server will reply
with XML data packet, containing an element called Image. See below for the format
of this element.

* **Camera**  
  The Image element contains one or several Camera elements. 

  * **ID**  
    Camera ID for the camera to which the settings apply.

  * **Enabled**  
    Turn on or of Image streaming from the selected camera.

  * **Format**  
    Picture format of the image stream. Available formats are: `RAWGrayscale`,
    `RAWBGR`, `JPG` and `PNG`.

  * **Width**  
    Width of the streaming image. This does not take into account the cropping.
    The width is the dimensions had the image not been cropped at all. Note that
    this does not have to be the same as the requested width, due to scaling in
    QTM. 32-bit integer.

  * **Height**  
    Height of the streaming image. This does not take into account the cropping.
    The height is the dimensions had the image not been cropped at all. Note that
    this does not have to be the same as the requested width, due to scaling in
    QTM.

  * **Left_Crop**  
    Position of the requested image left edge relative the original image. 32-bit
    float.  

    0.0 = Original image left edge **(Default)**.  
    1.0 = Original image right edge.

  * **Top_Crop**  
    Position of the requested image top edge relative the original image. 32-bit
    float.  

    0.0 = Original image top edge **(Default)**.  
    1.0 = Original image bottom edge.

  * **Right_Crop**  
    Position of the requested image right edge relative the original image.
    32-bit float.  

    0.0 = Original image left edge.  
    1.0 = Original image right edge **(Default)**.  

  * **Bottom_Crop**  
    Position of the requested image bottom edge relative the original image. 32-bit float.

    0.0 = Original image top edge.  
    1.0 = Original image bottom edge **(Default)**.

##### Example:
{{> image_xml_example }}

#### Skeleton XML parameters

In response to the command GetParameters Skeleton the QTM RT server will reply
with XML data packet, containing an element called Skeletons. See below for the format
of this element.

* **Skeleton**
  Element containing skeleton information.
  
  * **Name**
    Attribute with the name of the skeleton.
  
* **Segment**
  Element containing skeleton Segment information.

  * **Name**
    Attribute with the name of the skeleton segment.
    
  * **ID**
    Attribute with the id of the skeleton segment.

  * **Parent_ID**
    Attribute with the id of the parent skeleton segment. Parent_ID is omitted if this is the skeleton root segment.

  * **Position**
    Element containing attributes (x, y, z) with skeleton T-pose segment position.

  * **Rotation**
    Element containing attributes (x, y, z, w) with skeleton T-pose segment rotation. The segment rotation quaternion is in global coordinates.

##### Example:

{{> skeleton_xml_example }}

### Data packet
Each data frame is made up of one or more components, as specified in the
commands GetCurrentFrame or StreamFrames. The data frame contains a Count field
that specifies the number of components in the frame. Every component starts
with a component header – identical (in layout) to the packet header. 

**Data packet header**

Bytes | Name            | Type           | Value/Description
----- | --------------- | -------------- | -----------------
4     | Size            | 32-bit integer | 8 bytes packet header + 12 bytes data frame header + the size of all the components and their headers.
4     | Type            | 32-bit integer | Value = 3.
8     | Marker Timestamp | 64-bit integer | Number of microseconds from start. The timestamp is only valid if at least one camera is in marker mode.<br />The timestamp value is not valid for the Analog, Force and Gaze Vector data frame components, they have their own timestamps in their component data. 
4     | Marker Frame Number | 32-bit integer | The number of this frame. The frame number is only valid if at least one camera is in marker mode.<br />The frame number is not valid for the Analog, Force and Gaze Vector data frame components. They have their own frame numbers within the component. 
4     | Component Count | 32-bit integer | The number of data components in the data packet.

**Component data** (Repeated *Component Count* times)

Bytes    |  Name           | Type           | Value/Description
-------- | --------------- | -------------- | ------------------
4        |  Component Size | 32-bit integer |  Size of Component Data + 8 bytes component header.
4        |  Component Type | 32-bit integer | The type of the component. Defined in the following section.
Size - 8 |  Component Data | Mixed          | Component-specific data. Defined in [Data component types](#data-component-types) and [2D and 2D linearized component](#2d-and-2d-linearized-component) sections.


#### Data component types

The `Component Type` field of the data component header is a number that should
be interpreted according to the table below. These are the data frame component
types that are defined in the protocol so far.

Name                                     | Type     | Description
---------------------------------------- | -------- | ------------
[2D](#2d-components)                     | 7        | 2D marker data
[2D_Linearized](#2d-components)          | 8        | Linearized 2D marker data
[3D](#3d-components)                     | 1        | 3D marker data
[3D_Residuals](#3d-components)           | 9        | 3D marker data with residuals
[3D_No_Labels](#3d-components)           | 2        | Unidentified 3D marker data
[3D_No_Labels_Residuals](#3d-components) | 10       | Unidentified 3D marker data with residuals
[6D](#6dof-components)                   | 5        | 6D data - position and rotation matrix
[6D_Residuals](#6dof-components)         | 11       | 6D data - position and rotation matrix with residuals
[6D_Euler](#6dof-components)             | 6        | 6D data - position and Euler angles
[6D_Euler_Residuals](#6dof-components)   | 12       | 6D data - position and Euler angles with residuals
[Analog](#analog-data)                   | 3        | Analog data from available analog devices
[Analog_Single](#analog-single-data)     | 13       | Analog data from available analog devices. Only one sample per channel and camera frame. The latest sample is used if more than one sample is available.
[Force](#force-components)               | 4        | Force data from available force plates.
[Force_Single](#force-components)        | 15       | Force data from available force plates. Only one sample per plate and camera frame. The latest sample is used if more than one sample is available.
[Image](#image-component)                | 14       | Image frame from a specific camera. Image size and format is set with the XML settings, see [Image settings](#image-settings).
[Gaze_Vector](#gaze-vector-component)    | 16       | Gaze vector data defined by a unit vector and position.
[Timecode](#timecode-component)          | 17       | IRIG or SMPTE timecode
[Skeleton](#skeleton-component)          | 18       | Skeleton segment information


#### 2D components

There are two different 2D components that shares the same marker header.

- 2D
- 2D lineraized

The 2D and 2D linearized data frame format are the same. The only difference is
that the coordinates are linearized in 2D linearized.

Bytes | Name                | Type           | Description
----- | ------------------- | -------------- | -----------
4     | Component Size      | 32-bit integer | The size of the component including the header (Component Size, Component Type and Camera Count).
4     | Component Type      | 32-bit integer | Value 7 or 8. See [Data component types](#data-component-types).
4     | Camera Count        | 32-bit integer | Number of cameras.
2     | 2D Drop Rate        | 16-bit integer | Number of individual 2D frames that have been lost in the communication between QTM and the cameras.<br><br>The value is in frames per thousand, over the last 0.5 to 1.0 seconds. Range 0-1000. A high value is a sign that the cameras are set at a frequency that is too high for the current network topology to transmit reliably.
2     | 2D Out Of Sync Rate | 16-bit integer | Number of individual 2D frames in the communication between QTM and the cameras, which have not had the same frame number as the other frames.<br><br>The value is in frames per thousand over the last 0.5 to 1.0 seconds, Range 0-1000. A high value is a sign that the cameras are set at a frequency that is too high for the cameras to process in real time.


Repeated *Camera Count* times:

Bytes             | Name         | Type           | Description
----------------- | ------------ | -------------- | -----------
4                 | Marker Count | 32-bit integer | The number of markers for this camera in this frame.
1                 | Status Flags | 8-bit integer  | Bit 1: Too much light enters the camera. Please increase the threshold level or <br>lower the exposure time. If measuring at high frequencies, try to reduce the image size.<br><br>Bit 2-8: Not used.
12 * Marker Count | 2D data      | Mixed          | 2D marker data from the camera, described below:

2D Data, repeated *Marker Count* times:

Bytes | Name       | Type           | Description
----- | ---------- | -------------- | -----------
4     | X          | 32-bit integer | X coordinate of the marker.
4     | Y          | 32-bit integer | Y coordinate of the marker.
2     | Diameter X | 16-bit integer | Marker X size.
2     | Diameter Y | 16-bit integer | Marker Y size.

#### 3D components

There are four different 3D components that shares the same marker header.

- 3D
- 3D with residuals
- 3D no labels
- 3D no labels with residuals 


Bytes | Name                  | Type           | Description
----- | --------------------- | -------------- | -----------
4     | Component Size        | 32-bit integer | The size of the component including the header (Component Size, Component Type and Marker Count).
4     | Component Type        | 32-bit integer | Value = 1, 2, 9 or 10. See [Data component types](#data-component-types). 
4     | Marker Count          | 32-bit integer | The number of markers in this frame.
2     | 2D Drop Rate          | 16-bit integer | Number of individual 2D frames that have been lost in the communication between QTM and the cameras.<br><br>The value is in frames per thousand, over the last 0.5 to 1.0 seconds. Range 0-1000. A high value is a sign that the cameras are set at a frequency that is too high for the current network topology to transmit reliably.
2     | 2D Out Of Sync Rate   | 16-bit integer | Number of individual 2D frames in the communication between QTM and the cameras, which have not had the same frame number as the other frames.<br><br>The value is in frames per thousand over the last 0.5 to 1.0 seconds, Range 0-1000. A high value is a sign that the cameras are set at a frequency that is too high for the cameras to process in real time.

For the *3D* and the *3D with residuals* components, The markers of the 3D data always follow the labels of the 3D parameters. The same number of markers are sent each frame, and in the same order as the labels
of the 3D parameters. If a marker is missing from the frame, its X, Y and Z coordinates will have all their 32 bits set - this signifies a negative quiet Not-A-Number according to the IEEE 754 floating point standard.

Repeated *Marker Count* times:

Bytes | Name | Type         | Description
----- | ---- | ------------ | -----------
4     | X    | 32-bit float | X coordinate of the marker.
4     | Y    | 32-bit float | Y coordinate of the marker.
4     | Z    | 32-bit float | Z coordinate of the marker.
4 | ID | 32-bit integer | Id that identifies markers between frames.<br />**Only present for 3D no labels and 3D no labels with residuals**. 
4 | Residual | 32-bit float | Residual for the 3D point.<br />**Only present for 3D with residual and 3D no labels with residuals**. 

#### 6DOF components

There are four different 6DOF components that shares the same 6dof header.

- 6DOF
- 6DOF with residuals
- 6DOF Euler
- 6DOF Euler with residuals

 Bytes | Name                | Type           | Description                                                  
 ----- | ------------------- | -------------- | ------------------------------------------------------------ 
 4     | Component Size      | 32-bit integer | The size of the component including the header (Component Size, Component Type and Body Count). 
 4     | Component Type      | 32-bit integer | Value = 5, 6, 11 or 12. See [Data component types](#data-component-types). 
 4     | Body Count          | 32-bit integer | The number of 6DOF bodies in this frame.                     
 2     | 2D Drop Rate        | 16-bit integer | Number of individual 2D frames that have been lost in the communication between QTM and the cameras.<br><br>The value is in frames per thousand, over the last 0.5 to 1.0 seconds. Range 0-1000. A high value is a sign that the cameras are set at a frequency that is too high for the current network topology to transmit reliably. 
 2     | 2D Out Of Sync Rate | 16-bit integer | Number of individual 2D frames in the communication between QTM and the cameras, which have not had the same frame number as the other frames.<br><br>The value is in frames per thousand over the last 0.5 to 1.0 seconds, Range 0-1000. A high value is a sign that the cameras are set at a frequency that is too high for the cameras to process in real time. 


Repeated *Body Count* times:

Bytes | Name     | Type           | Description
----- | -------- | -------------- | -----------
4     | X        | 32-bit float   | X coordinate of the body.
4     | Y        | 32-bit float   | Y coordinate of the body.
4     | Z        | 32-bit float   | Z coordinate of the body.
9 * 4 | Rotation | 32-bit float | 3x3 rotation matrix of the body.<br />**Only present for 6DOF and 6DOF with residuals** 
4     | Angle 1  | 32-bit float   | First Euler angle, in degrees, as defined on the Euler tab in QTM's workspace options.<br />**Only present for 6DOF Euler and 6DOF Euler with residuals** 
4     | Angle 2  | 32-bit float   | Second Euler angle, in degrees, as defined on the Euler tab in QTM's workspace options.<br />**Only present for 6DOF Euler and 6DOF Euler with residuals** 
4     | Angle 3  | 32-bit float   | Third Euler angle, in degrees, as defined on the Euler tab in QTM's workspace options.<br />**Only present for 6DOF Euler and 6DOF Euler with residuals** 
4     | Residual | 32-bit float   | Residual for the 6D body.<br />**Only present for 6DOF with residuals and 6DOF Euler with residuals** 

#### Analog components

There are two different analog components that shares the same analog header.

- Analog
- Analog Single

 Bytes | Name                | Type           | Description                                                  
 ----- | ------------------- | -------------- | ------------------------------------------------------------ 
 4     | Component Size      | 32-bit integer | The size of the component including the header (Component Size, Component Type and Analog Device Count). 
 4     | Component Type      | 32-bit integer | Value = 3 or 13. See [Data component types](#data-component-types). 
 4     | Analog Device Count | 32-bit integer | Number of analog devices in this component.                  

If only streaming a selection of the analog channels, see [GetCurrentFrame](#getcurrentframe) and [StreamFrames](#streamframes), the order of the channels will be the same as in [Analog XML parameters](#analog-xml-parameters). 

> The update frequency of the analog data is dependent on the analog data source and its drivers. The QTM real-time server server can only deliver the data at the rate the data source is updated in QTM. Due to this, the analog single data can sometimes return a NaN. This indicates that the server has no updated analog value to transmit. Lower camera frequencies will make it less likely to miss any data.

##### Analog data

The Analog component sends a packet containing all analog samples that the server has buffered since the last analog frame. It contains it's own sample numbers (one per device), since the analog often runs at different frequency than the camera system.

Repeated *Analog Device Count* times:

 Bytes                              | Name             | Type           | Description                                                  
 ---------------------------------- | ---------------- | -------------- | ------------------------------------------------------------ 
 4                                  | Analog Device ID | 32-bit integer | Id of this analog device.                                    
 4                                  | Channel Count    | 32-bit integer | The number of channels of this analog device in this frame.  
 4                                  | Sample Count     | 32-bit integer | The number of analog samples per channel in this frame.      
 4                                  | Sample Number    | 32-bit integer | Order number of first sample in this frame. Sample Number is increased with the analog frequency. There are Channel Count values per sample number. 
 4 \* Channel Count \* Sample Count | Analog Data      | 32-bit float   | All available voltage samples per channel.<br /><br />Example:<br>Channel 1, Sample *Sample Number*<br>Channel 1, Sample *Sample Number* + 1<br>Channel 1, Sample *Sample Number* + 2<br>&hellip;<br>Channel 1, Sample *Sample Number* + Sample Count - 1<br>Channel 2, Sample *Sample Number* Channel 2, Sample *Sample Number + 1*<br>&hellip;<br><br>Analog Data is omitted if Sample Count is 0. 

##### Analog single data

The Analog single component sends a packet containing only one sample (the latest) per analog channel.

Repeated *Analog Device Count* times:

Bytes             | Name                  | Type                   | Description
----------------- | --------------------- | ---------------------- | -----------
4                 | Analog Device ID      | 32-bit integer         | Id of this analog device. 
4                 | Channel Count         | 32-bit integer         | The number of channels of this analog device in this frame.
4 * Channel Count | Analog Data           | 32-bit float | Voltage samples with increasing channel order. 

If the analog data has not been updated in QTM since last rt-packet, Analog Data will contain IEEE NaN (Not a number) float values.

#### Force components

There are two different force components that shares the same force header.

- Force
- Force single

 Bytes | Name           | Type           | Description                                                  
 ----- | -------------- | -------------- | ------------------------------------------------------------ 
 4     | Component Size | 32-bit integer | The size of the component including the header (Component Size, Component Type and Plate Count). 
 4     | Component Type | 32-bit integer | Value = 4 or 15. See [Data component types](#data-component-types). 
 4     | Plate Count    | 32-bit integer | The number of force plates in this frame.                    


Repeated *Plate Count* times:

Bytes            | Name             | Type                   | Description
---------------- | ---------------- | ---------------------- | -----------
4                | Force Plate ID   | 32-bit integer         | Id of the analog device in this frame. Id starts at 1.
4                | Force Count      | 32-bit integer         | The number of forces in this frame.<br />**Only present for Analog component.<br />Force Count is always 1 for Analog single component.** 
4                | Force Number     | 32-bit integer         | Order number of first force in this frame. Force Number is increased with the force frequency.<br />**Only present for Analog component.** 
36 * Force Count | Force Data       | 32-bit float | X coordinate of the force <br>Y coordinate of the force <br>Z coordinate of the force <br>X coordinate of the moment <br>Y coordinate of the moment <br>Z coordinate of the moment <br>X coordinate of the force application point <br>Y coordinate of the force application point <br>Z coordinate of the force application point<br /><br />**If no force data is available for an Analog single component, Force Data will contain IEEE NaN (Not a number).** 

#### Image component

Bytes | Name             | Type           | Description
----- | ---------------- | -------------- | -----------
4     | Component Size   | 32-bit integer | The size of the component including the header (Component Size, Component Type and Camera Count).
4     | Component Type   | 32-bit integer | Value = 14. See [Data component types](#data-component-types).
4     | Camera Count     | 32-bit integer | Number of cameras.

Repeated *Camera Count* times:

Bytes      | Name           | Type           | Description
---------- | -------------- | -------------- | -----------
4          | Camera ID      | 32-bit integer | Camera ID of the camera which the image comes from. Id starts at 1.
4          | Image Format   | 32-bit integer | Image format of the requested image. <br>0 = Raw Grayscale <br>1 = Raw BGR<br>2 = JPG <br>3 = PNG
4          | Width          | 32-bit integer | Width of the requested image.
4          | Height         | 32-bit integer | Height of the requested image.
4          | Left Crop      | 32-bit float   | Position of the requested image left edge relative the original image. <br>0: Original image left edge.  <br>1: Original image right edge.
4          | Top Crop       | 32-bit float   | Position of the requested image top edge relative the original image.  <br>0: Original image top edge.  <br>1: Original image bottom edge.
4          | Right Crop     | 32-bit float   | Position of the requested image right edge relative the original image.  <br>0: Original image left edge.  <br>1: Original image right edge.
4          | Bottom Crop    | 32-bit float   | Position of the requested image bottom edge relative the original image.  <br>0: Original image top edge.  <br>1: Original image bottom edge.
4          | Image Size     | 32-bit integer | Size of Image Data in number of bytes.
Image Size | Image Data     | Binary data    | Image data formatted according to the Image Format parameter.

#### Gaze vector

Bytes | Name              | Type           | Description
----- | ----------------- | ---------------|------------
4     | Component Size    | 32-bit integer | The size of the component including the header (Component Size, Component Type and Gaze Vector Count).
4     | Component Type    | 32-bit integer | Value = 16. See [Data component types](#data-component-types).
4     | Gaze Vector Count | 32-bit integer | Number of gaze vectors in this frame.

Repeated *Gaze Vector Count* times:

 Bytes                                    | Name             | Type           | Description                                                  
 ---------------------------------------- | ---------------- | -------------- | ------------------------------------------------------------ 
 4                                        | Sample Count     | 32-bit integer | The size of the component including the header (Component Size,<br>Component Type and Camera Count). 
 0 (Sample Count=0)<br>4 (Sample Count>0) | Sample Number    | 32-bit float   | Value = 16. See [Data component types](#data-component-types). 
 24 * Sample Count                        | Gaze Vector data | 32-bit float   | X component of the vector.<br>Y component of the vector.<br>Z component of the vector.<br>X coordinate of the vector.<br>Y coordinate of the vector.<br>Z coordinate of the vector. 


#### Timecode

Bytes | Name              | Type           | Description
----- | ----------------- | ---------------|------------
4     | Component Size    | 32-bit integer | The size of the component including the header (Component Size, Component Type and Timecode Count).
4     | Component Type    | 32-bit integer | Value = 17. See [Data component types](#data-component-types).
4     | Timecode Count    | 32-bit integer | Number of timecodes.

Repeated *Timecode Count* times:

Bytes                    | Name           | Type           | Description
----- | ---------------- | ---------------|------------
4     | Timecode type    | 32-bit integer | The type of timecode.<br><br>0: SMPTE (32 bit)<br>1: IRIG (64 bit)<br>2: Camera time (64 bit)
4     | Timecode Hi      | 32-bit integer | IRIG time code little endian format:<br>Bit 0 – 6: Year<br>Bit 7 – 15: Day of year<br><br>Camera time<br>Hi 32 bits of 64 bit integer timecode.
4     | Timecode Lo      | 32-bit integer | IRIG time code little endian format:<br>Bit 0 – 4: Hours<br>Bit 5 – 10: Minutes<br>Bit 11 - 16: Seconds<br>bit 17 - 20: Tenth of a seconds<br><br>SMPTE time code little endian format:<br>Bit 0 – 4: Hours<br>Bit 5 – 10: Minutes<br>Bit 11 - 16: Seconds<br>bit 17 - 21: Frame<br>Bit 22 - 31 Not used<br><br>Camera time<br>Lo 32 bits of 64-bit integer timecode.


#### Skeleton

Bytes | Name              | Type           | Description
----- | ----------------- | ---------------|------------
4     | Component Size   | 32-bit integer | The size of the component including the header (Component Size, Component Type and Skeleton Count).
4     | Component Type    | 32-bit integer | Value = 18. See [Data component types](#data-component-types).
4     | Skeleton Count    | 32-bit integer | Number of skeletonss.

Repeated *Skeleton Count* times:

Bytes                    | Name           | Type           | Description
----- | ---------------- | ---------------|------------
4     | Segment Count   | 32-bit integer | Number of segments in skeleton. 

Repeated *Segment Count* times (32 * Segment Count Bytes):

| Bytes | Name       | Type           | Description                     |
| ----- | ---------- | -------------- | ------------------------------- |
| 4     | Segment ID | 32-bit integer | ID of the segments in skeleton. |
| 4     | Position X | 32-bit float   | Segment position x coordinate.  |
| 4     | Position Y | 32-bit float   | Segment position y coordinate.  |
| 4     | Position Z | 32-bit float   | Segment position z coordinate.  |
| 4     | Rotation X | 32-bit float   | Segment rotation quaternion x.  |
| 4     | Rotation Y | 32-bit float   | Segment rotation quaternion y.  |
| 4     | Rotation Z | 32-bit float   | Segment rotation quaternion z.  |
| 4     | Rotation W | 32-bit float   | Segment rotation quaternion w.  |

If a skeleton is not visible in a frame, the segment count will be set to 0.

The rotation quaternion is sent in local coordinates. It can be changed to global coordinates by selecting skeleton:global as data type.

### No More Data packet

This type of packet is sent when QTM is out of data to send because a measurement has stopped or has not even started.

Bytes | Name   | Type           | Value
----- | ------ | -------------- | -----
4     | Size   | 32-bit integer | 8 (only the header is sent).
4     | Type   | 32-bit integer | 4

### C3D packet
This type of packet is sent as a response to the GetCaptureC3D command. It
contains a C3D file, with the latest captured QTM measurement.

Bytes | Name     | Type           | Value
----- | -------- | -------------- | -----
4     | Size     | 32-bit integer | 8 + n (header bytes + C3D file size)
4     | Type     | 32-bit integer | 5
n     | C3D file | Binary data    | C3D file

### QTM packet
This type of packet is sent as a response to the GetCaptureQTM command. It
contains a C3D file, with the latest captured QTM measurement.

Bytes | Name     | Type           | Value
----- | -------- | -------------- | -----
4     | Size     | 32-bit integer | 8 + n (header bytes + C3D file size)
4     | Type     | 32-bit integer | 8
n     | QTM file | Binary data    | QTM file

### Event packet
This type of packet is sent when QTM has an event to signal to the RT clients.

Bytes | Name  | Type           | Value
----- | ----- | -------------- | -----
4     | Size  | 32-bit integer | 9 (header bytes + event number)
4     | Type  | 32-bit integer | 6
1     | Event | 8-bit integer  | Event number: 1-13, see [Events](#events).

#### Events
The RT server sends an event data packet to all its clients when the RT server
changes state.

Event ID     | Name                    | Comment
-------------|-------------------------|--------
1            | Connected               | Sent when QTM has connected to the camera system.
2            | Connection Closed       | Sent when QTM has disconnected from the camera system.
3            | Capture Started         | Sent when QTM has started a capture.
4            | Capture Stopped         | Sent when QTM has stopped a capture.
5            | Not used                | Previously Fetching Finished, deprecated.
6            | Calibration Started     | Sent when QTM has started a calibration.
7            | Calibration Stopped     | Sent when QTM has stopped a calibration.
8            | RT From File Started    | Sent when QTM has started real time transmissions from a file.
9            | RT From File Stopped    | Sent when QTM has stopped real time transmissions from a file.
10           | Waiting For Trigger     | Sent when QTM is waiting for the user to press the trigger button.
11           | Camera Settings Changed | Sent when the settings have changed for one or more cameras. **Not included in the GetState response**. 
12           | QTM Shutting Down       | Sent when QTM is shutting down. **Not included in the GetState response**. 
13           | Capture Saved           | Sent when QTM has saved the current measurement. **Not included in the GetState response**. 
14           | Reserved                | Reserved.
15           | Reserved                | Reserved.
16           | Trigger                 | This event is sent by the server when QTM has received a trigger. **Not included in the GetState response**. 


### Discover packet
When this type of packet is broadcasted to QTM's auto discovery port, see [IP port numbers](#ip-port-numbers),
QTM responds with a discover response packet, see [Discover response packet](#discover-response-packet).

Bytes | Name            | Type           | Value
----- | --------------- | -------------- | -----
4     | Size            | 32-bit integer | 10 (little endian)
4     | Type            | 32-bit integer | 7 (little endian)
2     | Response Port   | 16-bit integer | Response port number: 0 - 65535. Network byte order (big endian).

Size and type is always sent as little endian 32 bit integers.

The Response Port is the UDP port number to which QTM sends a discover response
message. The response port is big endian.

#### Discover response packet
The discover response packet is a special command message of type 1. The
message contains a null terminated string, followed by the server's base port
number. 

Bytes | Name                   | Type           |  Value
----- | ---------------------- | -------------- | -----
4     | Size                   | 32-bit integer | 10 bytes. Little endian
4     | Type                   | 32-bit integer | 1. Little endian
n+1   | Server info string     | Char | Null terminated string containing, server host name, QTM version and number of connected cameras. n = string size.
2     | RT server base port.   | 16-bit integer | Base port number: 0 - 65535. Network byte order (Big endian).

**Note**: Size and Type is always sent as little endian 32 bit integers.

Example of a server info string: `MyComputer, QTM 2.5 (build 568), 5 cameras`.

**Note**: The base port number is only used for version 1.0 of the RT server,
see [IP port numbers](#ip-port-numbers) to get the desired port number.

## Open Sound Control (OSC)

The OSC version of the QTM RT server uses the [Open Sound Control 1.0 specification](http://opensoundcontrol.org).

### Connecting (OSC)
When using the OSC protocol, which uses UDP, the client must first establish a
connection with the server. This is because UDP is not connection-based like
TCP. This is done with the `Connect` command, see [Connect](#connect-osc-). A connection is closed
with the disconnect command, see [Disconnect](#disconnect-osc-).

The first thing that happens when you have connected to the QTM RT server with
OSC is that the server sends a welcome message string: `QTM RT Interface
connected`.

When using OSC it is not possible to set the protocol version, the latest
version will always be used.

#### Port number (OSC)
There is only one server port available for OSC, base port + 4. OSC is sent via
UDP packets. The clients listens to a UDP port for incoming OSC packets from
the server. The client UDP server port is set to the RT server with the Connect
command. See [Connecting](#connecting).

### Commands (OSC)
In the description of the commands, number parameters are designated by an n,
optional parameters are designated by enclosing brackets `[ ]` and choices between
possible values are designated by a `|`. Parentheses are used to group
parameters together. None of these characters (brackets, `|` or parentheses)
should be included in the command sent to the server. 

Command strings and their parameters never contain spaces, so a space character
(ASCII 32) is used as separator between command names and parameters.

Command strings and parameter strings are case insensitive.

| Command         | Parameters                                                   |
| --------------- | ------------------------------------------------------------ |
| Connect         | Port                                                         |
| Disconnect      |                                                              |
| Version         |                                                              |
| QTMVersion      |                                                              |
| GetState        |                                                              |
| GetParameters   | `All` &#124; `([General] [3D] [6D] [Analog] [Force] [Image] [GazeVector] [Skeleton])` |
| GetCurrentFrame | `[2D] [2DLin] [3D] [3DRes] [3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]]` |
| StreamFrames    | `Stop` &#124; `((FrequencyDivisor:n` &#124; `Frequency:n` &#124; `AllFrames) [UDP[:address]:port] ([2D] [2DLin] [3D] [3DRes][3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]]))` |

#### Connect (OSC)
OSC Format:
> **`Connect`** `Port`

Connects the client to the QTM RT server via the OSC protocol over UDP. The
Port argument is the UDP port on which the client listens for server responses. 

#### Disconnect (OSC)
Disconnects the client from the QTM RT server.

#### Version (OSC)
The server responds with `Version is n.n`, where `n.n` is the version of the RT
protocol currently used.

It is not possible to set the version when connected via the OSC protocol. You
can only retrieve current version.

###### Example:
```coffeescript
Command:    Version
Response:   Version is {{ version }}
```

#### QTMVersion (OSC)

See standard version of the command, [QTMVersion](#qtmversion)

#### GetState (OSC)

See standard version of the command,[GetState](#getstate) 

#### GetParameters (OSC)

See standard version of the command,[GetParameters](#getparameters) 

#### GetCurrentFrame (OSC)

See standard version of the command, [GetCurrentFrame](#getcurrentframe)

#### StreamFrames (OSC)

See standard version of the command, [StreamFrames](#streamframes)

### QTM RT Packets (OSC)

#### Structure (OSC)
All OSC packets sent to or from the server have the same general layout. They
don't have a header with size and type like the standard packet, see [QTM RT Packets](#qtm-rt-packets).

The content of the OSC packet differs slightly from the standard packet and
uses the OSC data types for int32, int64, float32 and strings. All OSC packets
sent to the RT server shall be sent in an OSC message with OSC address pattern
`/qtm`. The address pattern of packets sent from the server depends on the
packet type.  

#### Packet types (OSC)
The Type field of a QTM RT server packet header is a number that should be
interpreted according to the table below. These are the data types that are
defined in the protocol so far. Detailed descriptions of the data packets for
each type can be found in the sections following this one.

Name              | OSC address  | Description
------------------|--------------|------------
Error             | /qtm/error   | The last command generated an error. The error message is included in the packet.
Command           | /qtm         | A command sent to the server.
Command response  | /qtm/cmd_res | A response from the server to a command indicating that the command was successful.
XML               | /qtm/xml     | Data sent by the server in the form of XML, or data sent to the server in the form of XML.
Data frame header | /qtm/data    | This message contains the data header and is followed by one or several data frame component messages, containing the real-time data sent from the server. The contents of the frame may vary depending on the commands/settings sent to the server. The contents may also vary between frames due to different sampling frequencies and buffering properties of different data types.
No More Data      | /qtm/no_data | This packet type contains no data. It is a marker used to indicate that a measurement has finished or is not yet started.
Event             | /qtm/event   | This packet type contains event data from QTM.


#### Error packet (OSC)
Error packets are sent from the server only. Whenever you read a response from
the server, it may be an error packet instead of the packet type you expect.

OSC error packets are sent in an OSC message with address pattern `/qtm/error`
and contains one OSC string.

OSC type   | Name | Value
-----------|------|------
OSC-string | Data | Example: "Command not supported."


#### Command packet (OSC)
OSC command packets sent to the RT server shall be sent in an OSC message with address pattern “/qtm”.

OSC type   | Name | Value
-----------|------|------
OSC-string | Data | Example: "GetState"

#### Command response packet (OSC)
OSC command packets sent from the RT server as response to client commands is
sent in a OSC message with address pattern `/qtm/cmd_res`.

OSC type   | Name | Value
-----------|------|------
OSC-string | Data | "Connected"


#### XML packet (OSC)
The XML string contains the same data as for the standard [XML Packet](#xml-packet).
OSC XML packets are sent in an OSC message with address pattern `/qtm/xml`.

OSC type   | Name | Value
-----------|------|------
OSC-string | Data | XML string data. The XML data is described in [XML Packet](#xml-packet).


#### Data packet (OSC)
Each data frame is made up of one or more components, as specified in the
commands GetCurrentFrame or StreamFrames. The data frame contains a Count
that specifies the number of components in the frame. Every component starts
with a component header – identical (in layout) to the packet header. 

OSC data packets consist of one or several OSC messages enclosed in an OSC
bundle. The first message contains the data frame header and has the OSC
address pattern `/qtm/data`. It is followed by an OSC message for each data
component. See [OSC Data frame component types](#data-frame-component-types-osc-).

##### Data frame header (OSC)
The frame header and the data components are sent in an OSC bundle as separate
OSC messages.

 OSC type | Name                | Value                                                        
 -------- | ------------------- | ------------------------------------------------------------ 
 Int32    | Marker Timestamp Hi | Hi 32 bits of 64 bit timestamp value.<br><br>Number of microseconds from start. The timestamp value is not valid for the Analog, Force and Gaze Vector data frame components, they have their own timestamps in their component data. 
 Int32    | Marker Timestamp Lo | Lo 32 bits of 64 bit timestamp value. See above.             
 Int32    | SMPTE TimeCode      | SMPTE time code little endian format:<br> <br>Bit 0-4: Hours <br>Bit 5-10: Minutes <br>Bit 11-16: Seconds <br>Bit 17-21: Frame <br>Bit 22-30: Sub frame <br>Bit 31: Valid bit 
 Int32    | Marker Frame Number | The number of this frame. The frame number is not valid for the Analog, Force and Gaze Vector data frame components. They have their own sample numbers in their component data. 
 Int32    | 2DDropRate          | How many individual camera 2D frames that have been lost, in frames per thousand, over the last 0.5 to 1.0 seconds. Range 0-1000.<br><br>A high value is a sign that the cameras are set at a frequency that is too high for the current network topology to transmit reliably. 
 Int32    | 2DOutOfSyncRate     | How many individual camera 2D frames, in frames per thousand over the last 0.5 to 1.0 seconds, that have not had the same frame number as the other frames. Range 0-1000.<br><br>A high value is a sign that the cameras are set at a frequency that is too high for the cameras to process in real time. 
 Int32    | ComponentCount      | The number of data components in the data message. Each component is sent as a separate OSC message. 

##### Data frame component types (OSC)
Each data frame component has a unique OSC address. The table below shows the
OSC address for all data components.

Name                   | OSC address           | Description
-----------------------|-----------------------|-------------
2D                     | /qtm/2d               | 2D marker data
2D Linearized          | /qtm/2d_lin           | Linearized 2D marker data
3D                     | /qtm/3d               | 3D marker data. Each marker has its own OSC address. See [OSC 3D component](#3d-component-osc-).
3D Residuals           | /qtm/3d_res           | 3D marker data with residuals. Each marker has its own OSC address. See [3D with residuals component](#3d-with-residuals-component-osc-).
3D No Labels           | /qtm/3d_no_labels     | Unidentified 3D marker data.
3D No Labels Residuals | /qtm/3d_no_labels_res | Unidentified 3D marker data with residuals
Analog                 | /qtm/analog           | Analog data from available devices.
Analog Single          | /qtm/analog_single    | Analog data from available analog devices. Only one sample per channel and camera frame. The latest sample is used if more than one sample is available.
Force                  | /qtm/force            | Data from available force plates.
Force Single           | /qtm/force_single     | Force data from available force plates. Only one sample per plate and camera frame. The latest sample is used if more than one sample is available.
6D                     | /qtm/6d               | 6D data - position and rotation matrix. Each body has its own OSC address.  See [OSC 6DOF component](#6dof-component-osc-).
6D Residuals           | /qtm/6d_res           | 6D data - position and rotation matrix with residuals. Each body has its own OSC address. See [6DOF with residuals component](#6dof-with-residuals-component-osc-).
6D Euler               | /qtm/6d_euler         | 6D data - position and Euler angles. Each body has its own OSC address. See [6DOF Euler component](#6dof-euler-component-osc-).
6D Euler Residuals     | /qtm/6d_euler_res     | 6D data - position and Euler angles with residuals. Each body has its own OSC address. See [6DOF Euler with residuals component](#6dof-euler-with-residuals-component-osc-).
Gaze Vector | /qtm/gaze_vector | Gaze vector data – Unit vector and position. Each gaze vector has its own OSC address. 
Skeleton | /qtm/skeleton | Skeleton data – Position and rotation of all segments in the skeleton. Each skeleton has its own OSC address. 



##### 2D components (OSC)
There are two different 2D components.

- 2D
- 2D linearized

The 2D and 2D linearized data frame format are the same. The only difference is
that the coordinates are linearized in 2D linearized.

OSC address: `/qtm/2d` or `/qtm/2d_lin`.

OSC type | Name         | Description
---------|--------------|------------
Int32    | Camera Count | Number of cameras. 32-bit integer.


Repeated *Camera Count* times:

OSC type | Name         | Description
---------|--------------|------------
Int32    | Marker Count | The number of markers for this camera in this frame.
         | 2D data      | 2D marker data from the camera, described below:

2D data, repeated *Marker Count* times:


OSC type | Name       | Description
---------|------------|------------
Int32    | X          | X coordinate of the marker.
Int32    | Y          | Y coordinate of the marker.
Int32    | Diameter X | Marker X size.
Int32    | Diameter Y | Marker Y size.

##### 3D component (OSC)
Each marker is sent in a separate OSC message.

OSC address:  `/qtm/3d/`	The marker name is appended to the end of the address string.
Example: `/qtm/3d/marker1`.

OSC type | Name | Description
---------|------|------------
Float32  | X    | X coordinate of the marker.
Float32  | Y    | Y coordinate of the marker.
Float32  | Z    | Z coordinate of the marker.

##### 3D with residuals component (OSC)
Each marker is sent in a separate OSC message.

OSC address: `/qtm/3d_res/`	The marker name is appended to the end of the address string.
Example: `/qtm/3d_res/marker1`.

OSC type | Name     | Description
---------|----------|------------
Float32  | X        | X coordinate of the marker.
Float32  | Y        | Y coordinate of the marker.
Float32  | Z        | Z coordinate of the marker.
Float32  | Residual | Residual for the 3D point.

##### 3D no labels component (OSC)

OSC address: `/qtm/3d_no_labels/`

OSC type | Name         | Description
---------|--------------|------------
Int32    | Marker Count | The number of markers in this frame.

Repeated *Marker Count* times:

OSC type | Name | Description
---------|------|------------
Float32  | X    | X coordinate of the marker.
Float32  | Y    | Y coordinate of the marker.
Float32  | Z    | Z coordinate of the marker.
Int32    | ID   | An unsigned integer ID that serves to identify markers between frames.

##### 3D no labels with residuals component (OSC)

OSC address: `/qtm/3d_no_labels_res/`

OSC type | Name         | Description
---------|--------------|------------
Int32    | Marker Count | The number of markers in this frame.

Repeated *Marker Count* times:

OSC type | Name     | Description
---------|----------|------------
Float32  | X        | X coordinate of the marker.
Float32  | Y        | Y coordinate of the marker.
Float32  | Z        | Z coordinate of the marker.
Int32    | ID       | An unsigned integer ID that serves to identify markers between frames.
Float32  | Residual | Residual for the 3D point.

##### Analog component (OSC)

OSC address: `/qtm/analog/`

OSC type | Name                | Description
---------|---------------------|------------
Int32    | Analog Device Count | Number of analog devices in this component.

Repeated *Analog Device Count* times:

OSC type | Name             | Description
---------|------------------|------------
Int32    | Analog Device ID | Id of this analog device.
Int32    | Channel Count    | The number of channels of this analog device in this frame.
Int32    | Sample Count     | The number of analog samples per channel in this frame.
Int32    | Sample Number    | Order number of first sample in this frame. Sample Number is increased with the analog frequency. There are Channel Count values per sample number.
Float32  | Analog Data      | There are (Channel Count * Sample Count) voltage values. The samples are ordered like this:<br><br>Channel 1, Sample *Sample Number* <br>Channel 1, Sample *Sample Number + 1* <br>Channel 1, *Sample Sample Number + 2* <br>&hellip;.  <br>Channel 1, Sample *Sample Number + Sample Count – 1* <br>Channel 2, Sample *Sample Number* <br>Channel 2, Sample *Sample Number + 1* <br>&hellip;

##### Analog single component (OSC)

OSC address: `/qtm/analog_single/

OSC type | Name                | Description
---------|---------------------|------------
Int32    | Analog Device Count | Number of analog devices in this component.

Repeated *Analog Device Count* times:

OSC type  | Name               | Description
----------|--------------------|------------
Int32     | Analog Device ID   | Id of this analog device.
Int32     | Channel Count      | The number of channels of this analog device in this frame.
Float32   | Analog Data        | There are Channel Count voltage values.

If there is no analog data available, Channel Count is set to 0 and Analog Data is omitted.

##### Force component (OSC)

OSC address: `/qtm/force/

OSC type  | Name        | Description
----------|-------------|------------
Int32     | Plate Count | The number of force plates in this frame.


Repeated *Plate Count* times:

OSC type | Name           | Description
---------|----------------|------------
Int32    | Force Plate ID | Id of the analog device in this frame. Starts at 1.
Int32    | Force Count    | The number of forces in this frame.
Int32    | Force Number   | Order number of first force in this frame. Force Number is increased with the force frequency.
Float32  | Force Data     | There are *Force Count* force samples. Total size of the Force Data is 9 * *Force Count* Float32 values in following order:<br><br>X coordinate of the force <br>Y coordinate of the force <br>Z coordinate of the force <br>X coordinate of the moment <br>Y coordinate of the moment <br>Z coordinate of the moment <br>X coordinate of the force application point <br>Y coordinate of the force application point <br>Z coordinate of the force application point 

If Force Count = 0 (force not visible in QTM), Force Number and Force Data is omitted.

##### Force single component (OSC)

OSC address: `/qtm/force_single/

OSC type | Name        | Description
---------|-------------|------------
Int32    | Plate Count | The number of force plates in this frame.


Repeated *Plate Count* times:

 OSC type | Name           | Description                                                  
 -------- | -------------- | ------------------------------------------------------------ 
 Int32    | Force Plate ID | Id of the analog device in this frame. Starts at 1.          
 Float32  | Force Data     | Each force sample consists of 9 Float32 values in following order:<br><br>X coordinate of the force <br>Y coordinate of the force <br>Z coordinate of the force <br>X coordinate of the moment <br>Y coordinate of the moment <br>Z coordinate of the moment <br>X coordinate of the force application point <br>Y coordinate of the force application point <br>Z coordinate of the force application point 

If force not visible in QTM, Force Data is omitted.

##### 6DOF component (OSC)
Each body is sent in a separate OSC message.

OSC address: `/qtm/6d/`	The body name is appended to the end of the address string.
Example:`/qtm/6d/body1`.


OSC type | Name     | Description
---------|----------|------------
Float32  | X        | X coordinate of the body.
Float32  | Y        | Y coordinate of the body.
Float32  | Z        | Z coordinate of the body.
Float32  | Rotation | 3x3 Rotation matrix of the body. Consists of 9 Float32 values.

##### 6DOF with residuals component (OSC)
Each body is sent in a separate OSC message.

OSC address: `/qtm/6d_res/`	The body name is appended to the end of the address string.
Example:`/qtm/6d_res/body1`.

OSC type | Name     | Description
---------|----------|------------
Float32  | X        | X coordinate of the body.
Float32  | Y        | Y coordinate of the body.
Float32  | Z        | Z coordinate of the body.
Float32  | Rotation | 3x3 Rotation matrix of the body. Consists of 9 Float32 values.
Float32  | Residual | Residual for the 6D body.

##### 6DOF Euler component (OSC)
Each body is sent in a separate OSC message.

OSC address: `/qtm/6d_euler/`	The body name is appended to the end of the address string.
Example:`/qtm/6d_euler/body1`.

OSC type | Name    | Description
---------|---------|------------
Float32  | X       | X coordinate of the body.
Float32  | Y       | Y coordinate of the body.
Float32  | Z       | Z coordinate of the body.
Float32  | Angle 1 | First Euler angle, in degrees, as defined on the Euler tab in QTM's workspace options.
Float32  | Angle 2 | Second Euler angle.
Float32  | Angle 3 | Third Euler angle.

##### 6DOF Euler with residuals component (OSC)
OSC address: `/qtm/6d_euler_res/`	The body name is appended to the end of the address string.
Example:`/qtm/6d_euler_res/body1`.


OSC type | Name     | Description
---------|----------|------------
Float32  | X        | X coordinate of the body.
Float32  | Y        | Y coordinate of the body.
Float32  | Z        | Z coordinate of the body.
Float32  | Angle 1  | First Euler angle, in degrees, as defined on the Euler tab in QTM's workspace options.
Float32  | Angle 2  | Second Euler angle.
Float32  | Angle 3  | Third Euler angle.
Float32  | Residual | Residual for the 6D body.

##### Gaze vector component (OSC)

Each gaze vector is sent in a separate OSC message.

OSC address: `/qtm/gaze_vector/`	The body name is appended to the end of the address string.
Example:`/qtm/gaze_vector/Eye`.

| OSC type | Name          | Description                                                  |
| -------- | ------------- | ------------------------------------------------------------ |
| Int32    | Sample Count  | Number of vector samples in this frame.                      |
| Int32    | Sample Number | Order number of first gaze vector sample in this frame. *Sample Number* is increased with the gaze vector frequency. |

Repeated *Sample Count* times:

| OSC type | Name       | Description                          |
| -------- | ---------- | ------------------------------------ |
| Float32  | Vector X   | X component of the gaze unit vector. |
| Float32  | Vector Y   | Y component of the gaze unit vector. |
| Float32  | Vector Z   | Z component of the gaze unit vector. |
| Float32  | Position Z | X coordinate of the gaze vector.     |
| Float32  | Rotation X | Y coordinate of the gaze vector.     |
| Float32  | Rotation Y | Z coordinate of the gaze vector.     |

##### Skeleton component (OSC)

Each skeleton consists of several segments. All segments are sent in a separate OSC message.

OSC address: `/qtm/skeleton/`	The skeleton and segment name is appended to the end of the address string.
Example:`/qtm/skeleton/JohnDoe/Waist`.

| OSC type | Name       | Description                    |
| -------- | ---------- | ------------------------------ |
| Int32    | ID         | Segment id.                    |
| Float32  | Position X | Segment position x coordinate. |
| Float32  | Position Y | Segment position y coordinate. |
| Float32  | Position Z | Segment position z coordinate. |
| Float32  | Rotation X | Segment rotation quaternion x. |
| Float32  | Rotation Y | Segment rotation quaternion y. |
| Float32  | Rotation Z | Segment rotation quaternion z. |
| Float32  | Rotation W | Segment rotation quaternion w. |

### No More Data packet (OSC)

This type of packet is sent when QTM is out of data to send because a
measurement has stopped or has not even started.

OSC no data packets are sent in a OSC message with address pattern `/qtm/no_data`.

OSC type | Name    | Value
---------|---------|------
Nil      | No data | OSC Nil type contains no data.

### Event Data packet (OSC)
OSC event packets are sent in an OSC message with address pattern `/qtm/event`.

OSC type   | Name  | Value
-----------|-------|------
OSC-string | Event | Event string. See [OSC Events](#events-osc-).

#### Events (OSC)
The RT server sends an event data packet to all its clients when the RT server
changes state.

| Event ID | Name                    | Comment                                                      |
| -------- | ----------------------- | ------------------------------------------------------------ |
| 1        | Connected               | Sent when QTM has connected to the camera system.            |
| 2        | Connection Closed       | Sent when QTM has disconnected from the camera system.       |
| 3        | Capture Started         | Sent when QTM has started a capture.                         |
| 4        | Capture Stopped         | Sent when QTM has stopped a capture.                         |
| 5        | Fetching Finished       | Sent when QTM has finished fetching a capture.               |
| 6        | Calibration Started     | Sent when QTM has started a calibration.                     |
| 7        | Calibration Stopped     | Sent when QTM has stopped a calibration.                     |
| 8        | RT From File Started    | Sent when QTM has started real time transmissions from a file. |
| 9        | RT From File Stopped    | Sent when QTM has stopped real time transmissions from a file. |
| 10       | Waiting For Trigger     | Sent when QTM is starting to wait for trigger to start a measurement. |
| 11       | Camera Settings Changed | Sent when the settings have changed for one or several cameras. Not included in the GetState command response. |
| 12       | QTM Shutting Down       | Sent when QTM is shutting down. Not included in the GetState command response. |
| 13       | Capture Saved           | Sent when QTM has saved current measurement. Not included in the GetState command response. |

## Telnet

The OSC version of the QTM RT server uses the [Open Sound Control 1.0 specification](http://opensoundcontrol.org).

### Connecting (Telnet)

Connect using the Telnet
protocol on port 22221 of the QTM computer. Port 22221 (*base port – 1)* is the default Telnet port in QTM, see [IP port numbers](#ip-port-numbers) .

### Commands (Telnet)

In the description of the commands, number parameters are designated by an *n*, optional parameters are designated by enclosing brackets [] and choices between possible values are designated by a ‘|’. Parentheses are used to group parameters together. None of these characters (brackets, ‘|’ or parentheses) should be included in the command sent to the server. 

Command strings and their parameters never contain spaces, so a space character (ASCII 32) is used as separator between command names and parameters.

Command strings and parameter strings are case insensitive.

| Command        | Parameters                                                   |
| -------------- | ------------------------------------------------------------ |
| Version        | [n.n]                                                        |
| QTMVersion     |                                                              |
| ByteOrder      |                                                              |
| GetState       |                                                              |
| GetParameters  | `All` &#124; `([General] [3D] [6D] [Analog] [Force] [Image] [GazeVector] [Skeleton])` |
| StreamFrames   | `Stop` &#124; `((FrequencyDivisor:n` &#124; `Frequency:n` &#124; `AllFrames) [UDP[:address]:port] ([2D] [2DLin] [3D] [3DRes][3DNoLabels] [3DNoLabelsRes] [Analog[:channels]] [AnalogSingle[:channels]] [Force] [ForceSingle] [6D] [6DRes] [6DEuler] [6DEulerRes] [Image] [GazeVector] [Timecode] [Skeleton[:global]]))` |
| TakeControl    | `[Password]`                                                 |
| ReleaseControl |                                                              |
| New            |                                                              |
| Close          | -                                                            |
| Start          | `[RTFromFile]`                                               |
| Stop           | -                                                            |
| Load           | `Filename`                                                   |
| Save           | `Filename [Overwrite]`                                       |
| LoadProject    | `ProjectPath`                                                |
| Trig           |                                                              |
| SetQTMEvent    | `Label`                                                      |
| Reprocess      |                                                              |
| Led            | `Camera (On` &#124; `Off` &#124; `Pulsing) (Green`&#124;`Amber`&#124;`All)` |
| Quit           | -                                                            |

#### Version (Telnet)

> **`Version`**

The server responds with *Version is n.n*, where *n.n* is the version of the RT protocol currently used.

It is not possible to set the version when connected via the Telnet protocol. You can only retrieve current version.

###### Example:

```coffeescript
Command:    Version
Response:   Version is {{ version }}
```

#### QTMVersion (Telnet)

See standard version of the command, [QTMVersion](#qtmversion).

#### ByteOrder (Telnet)

See standard version of the command, [ByteOrder](#byteorder).

#### GetState (Telnet)

> **`GetState`**

This command makes the RT server send current QTM state as an event data
packet. The event packet will only be sent to the client that sent the GetState
command. `GetState` will not show the **Camera Settings Changed**,
**QTM Shutting Down** and **Capture Saved events**.

###### Example:

```coffeescript
Command:    GetState

Response:   Connected                 or
            Connection Closed         or
            Capture Started           or
            Capture Stopped           or
            Capture Fetching Finished or
            Calibration Started       or
            Calibration Stopped       or
            RT From File Started      or
            RT From File Stopped      or
            Waiting For Trigger       or
            Capture Saved
```

#### GetParameters (Telnet)

See standard version of the command, [GetParameters](#getparameters).

#### StreamFrames (Telnet)

See standard version of the command, [StreamFrames](#streamframes).

#### TakeControl (Telnet)

See standard version of the command, [TakeControl](#takecontrol).

#### ReleaseControl (Telnet)

See standard version of the command, [ReleaseControl](#releasecontrol).

#### New (Telnet)

See standard version of the command, [New](#new).

#### Close (Telnet)

See standard version of the command, [Close](#close).

#### Start (Telnet)

See standard version of the command, [Start](#start).

#### Stop (Telnet)

See standard version of the command, [Stop](#stop).

#### Load (Telnet)

See standard version of the command, [Load](#load).

#### Save (Telnet)

See standard version of the command, [Save](#save).

#### LoadProject (Telnet)

See standard version of the command, [LoadProject](#loadproject).

#### Trig (Telnet)

See standard version of the command, [Trig](#trig).

#### SetQTMEvent (Telnet)

See standard version of the command, [SetQTMEvent](#setqtmevent).

#### Reprocess (Telnet)

See standard version of the command, [Reprocess](#reprocess).

#### Led (Telnet)

See standard version of the command, [Led](#led).

#### Quit (Telnet)

See standard version of the command, [Quit](#quit).

## Changelog

### Changes in 1.20

- Added new settings for rigid body points. Id and virtual.
- Removed Camera_System from settings.

### Changes in 1.19

- Added new data component, skeleton.
- Removed data component All from GetCurrentFrame and StreamFrames.

### Changes in 1.18
 * Added Miqus Video Color camera type.
 * Added Auto white balance camera settings

### Changes in 1.17
 * Added support for external time base `IRIG`.
 * Added `IRIG` time code to OSC frame header.
 * Added new data component, `Timecode`.
 * Added new event type, `Trigger`.
 * Added Auto exposure camera settings.

### Changes in 1.16
 * Added Miqus Video camera type.
 * Removed Video modes settings from general camera settings.
 * Added video Resolution and Aspect_Ratio settings to general camera settings.
 * Added Euler rotation names to 6DOF settings.
 * Added Lens Control focus and aperture settings.

### Changes in 1.15
 * Added `Led` command.
 * Added `Reprocess` command.
 * Added Miqus Sync Unit camera type.
 * Added general camera settings for Miqus Sync Unit trigger settings
   (`Start_On_Trigger_NO`, `Start_On_Trigger_NC`,
   `Start_On_Trigger_Software`)
 * Added general camera setting, `Supports_HW_Sync`, `Sync_Out2` and
   `Sync_Out_MT`.
 * Removed SRAM wired sync out mode.
 * Added `Camera_System` and subvalue `Type` to general XML.

### Changes in 1.14
 * Added bone color to 3d XML parameters.
 * Added support for new processing action: `PreProcessing2D`.
 * Added support for real-time processing actions and reprocessing actions settings.
 * Changed XML settings tag from `Duty cycle` to `Duty_Cycle`.
 * Added option to only stream data from selected analog channels.

### Changes in 1.13
 * Added export to AVI file and gaze vector processing actions.
 * Updated Telnet protocol version.
 * Made it possible to change video mode and video capture frequency.
 * Changes to force calibration matrix. Now supports more than 6x6 matrixes.
 * Added support for trajectory bones.

### Changes in 1.12

 * Added `Load` function for loading measurements in QTM.
 * Added `LoadProject` function for loading project in QTM.
 * Added new sync out mode SRAM wired in General/Camera settings.

### Changes in 1.11

 * Changed analog XML parameters. Now all channels have their own unit setting.
 * Changed timestamp in OSC data frame header, from one 64 bit integers, to two
   32 bit integers (hi and lo word). 

### Changes in 1.10

 * Added general camera XML parameters `External_Time_Base`,
 * `Processing_Actions` and Camera/Underwater.
 * Added 3D XML parameters `CalibrationTime`.
 * Changed Save command. Added overwrite parameter.
 * Made it possible to change the capture frequency via the frequency general
   setting.
 * Changed `GetLastEvent` to `GetState`.
 * Support fetching of General and Image parameters even if QTM is not
   connected to a camera system.
 * Changed the Close command. It will now respond with `Closing file` instead
   of `Closing connection` when not in RT (preview) mode. The “No connection to
   close” response is now sent as a command response string, not an error
   string.
 * Changed New command response. The `Already connected` response is now sent
   as a command string, not an error string.
 * Added Capture Saved event.
 * Removed `Fetching Finished` event.
 * Added `GetCaptureQTM` command.
 * Changed `GetCapture` response. Send a command response `Sending capture`
   before sending the XML packet with the capture file.
 * Added RT server base port to discover response packet.

### Changes in 1.9
 * Added Force single data component.
 * Fixed bug in OSC Analog, Analog single and Force data components.
 * Fixed bug in OSC 3D no labels data component.
 * Allow capture start via RT server even if camera system isn’t calibrated.

### Changes in 1.8
 * Added events: `Camera Settings Changed` and `QTM Shutting Down`.
 * Added RT server auto discovery.
 * New data frame component: Image
 * Added new XML setting: Image and General Camera setting Orientation.
 * GetParameters command returns `Parameters not available` error string,
   instead of a `No More Data” package`.
 * Added status byte to 2D and 2D linearized data components.
 * Changed all 64-bit float coordinates to 32-bit floats in the 3D and 6DOF
   data frames.
 * Removed all 32-bit padding form the protocol.
 * Don't broadcast string `Server shutting down` to all clients when shutting
   down. Use event `QTM Shutting Down` instead.
 * Added password to `TakeControl`.
 * Fixed bug in AnalogSingle Big Endian data component.
 * Changed name of `GetCapture` to `GetCaptureC3D`
 * Changed Force plate identification in XML strings from `Force_Plate_Index`
   to `Plate_ID`.
 * Changed name of Event command to `SetQTMEvent`.

### Changes in 1.7
 * Added `Trig` command.
 * Added `Event` command.
 * Added event: `Waiting For Trigger`.
 * Changed format of XML data packet and added new XML setting. General
   setting: `Start On External Trigger`.

### Changes in 1.6
 * Added OSC support.
 * Apply rotation and translation to 6 DOF bodies.
 * Added `Camera` to general XML parameters.
 * Added `Save` command.

### Changes in 1.5
* Added new command: `QTMVersion`.
* `Version` command without argument will return current version used by the
  server.
* Added new general parameter: `Capture Time`.
* Added possibility to change settings via an XML parameter file. Supported
  settings: `Capture time` and Force plate corners.
* Added new commands: `New`, `Close`, `Start`, `Stop`, `GetCapture` and
  `GetLastEvent`.
* Added events: `Connected`, `Closed`, `Capture started` and `Capture stopped`.

### Changes in 1.4
 * Added 6D (6 DOF) XML parameters.
 * Added color to 3D XML parameters.
 * Removed LicenceName argument in the CheckLicence command.

### Changes in 1.3
 * Added `2D Drop Rate` and `2D Out Of Sync Rate` to frame component header for:
   3d, 3DRes, 3DnoLabels and 3DNoLabelsRes.

### Changes in 1.2
 * `2Dlin`, `3DRes`, `3DNoLabelsRes`, `6DRes` and `6DEulerRes` data type components were added.
 * CheckLicense command added.
 * `<AxisUpwards>` item added to XML parameters for 3D. 

### Changes in 1.1
 * UDP support added to the `StreamFrames` command.
 * Analog data frame component changed. Includes sample number and can contain
   several samples per channel in a single data frame.
 * Force data frame component changed. Includes sample number and can contain
   several samples per force plate in a single data frame.
 * Analog parameters changed, device ID added.
 * Force parameters changed, device ID added.
 * `SendParameters` command changed to `GetParameters`.


@@TOC@@

## Introduction

The Qualisys Track Manager software is used to collect and process motion capture
data from Qualisys motion capture cameras. The software is running under Windows
and offers both post-processing and real-time processing functionality.
The processed real-time data can be retrieved from QTM over a TCP/IP (or UDP/IP)
connection in real-time. This document describes the protocol used in such a
connection.


## Protocol versions

This document describes the 1.12 version of the QTM RT server protocol.


### Standard

QTM is backwards compatible with all previous versions of the protocol. The QTM RT
server keeps track of the protocol version used by each RT client connected to it, and
adapts the data to be sent to each client according to their selected protocol version.
To ensure that a particular client will work with all future releases of QTM, the client
only needs to send the Version command to the QTM RT server when connecting to it.
At the end of this document (in section 6.10.1 on page 77), there is a list of the changes
that have been made to the protocol between different versions.


### Open sound control

Version 1.6 and later of the QTM RT server protocol supports the OSC (Open Sound
Control) protocol over UDP. Connecting to the RT server when using OSC, differs from
the standard version of the RT protocol. See 6.1.

## Overview

### Auto discover

It is possible to auto discover any computers running QTM version 2.4 (build 551) or
later on your local area network. This is done by broadcasting an UDP packet to the
QTM auto discover port, see 3.2.2. The discover packet shall contain the port number to
which QTM sends an UDP response string, see 5.11. Except for the IP address,
the client will also respond with the host name, QTM version and number of
connected cameras.


### Connecting

Connecting to the QTM RT server is simply a matter of connecting to a specific
TCP/IP port on the computer where QTM is running.

The first thing that happens when you have connected to the QTM RT server is
that the server sends a welcome message string: QTM RT Interface connected.
Number of simultaneous connections is limited to 10. If the limit is reached
while connecting, QTM will respond with an error message: Connection refused.
Max number of clients reached.

The first command that the client should send to the server is the Version
command, to make sure that QTM is using the RT protocol version expected by the
client. If the client doesn’t send the Version command, QTM will use version
1.1.

If the client will request streaming data over TCP/IP (default) or polled data,
make sure to disable Nagle’s algorithm for the TCP/IP port. See 3.2.1.


#### Disabling Nagle&rsquo;s algorithm

The TCP protocol by default uses a performance improvement called Nagle’s
algorithm that reduces the bandwidth used by the TCP connection. In the case of
a real-time server that sends small amounts of data in each frame, this
algorithm should be turned off. Otherwise the server (and client) will wait to
fill a full TCP packet, or until the previous packet has been acknowledged by
the receiver, before sending it to the client (or the server).

On the Windows platform, Nagle’s algorithm can be turned off by enabling the
TCP_NODELAY option for the TCP/IP port.

If you use UDP/IP streaming only (via the StreamFrames command), it is not
necessary to turn off Nagle’s algorithm for the TCP/IP port, since a little
higher latency can be accepted in the parts of the protocol that do not stream
data in real-time. The UDP streaming protocol has no such bandwidth
optimization and is designed for low latency-applications.

#### IP port numbers

In the &ldquo;RT output&rdquo; tab of the Workspace Options dialog in QTM, you can
configure the QTM RT server ports. You can only edit the base port (22222 by
default). It is the legacy server port, for version 1.0 of the protocol. All
other ports except for the auto discover port are set from the base port. See
table below.

### Protocol structure

All data sent between the server and the client is packaged in packets
with an 8-byte header consisting of a 4-byte Size field and a 4-byte
Type field. 

\

In most cases, the QTM RT server does not send any data to the client
unless requested. The client sends a command and the QTM RT server sends
a response in form of a string or XML data or frame data. The client
should however be able to handle cases when packets arrive which is not
a response to a command. For example, an event (see  REF \_Ref253404986
\\r \\h 5.10 and  REF \_Ref253405009 \\r \\h 6.10) or an error (see  REF
\_Ref253405060 \\r \\h 5.3 and  REF \_Ref253405072 \\r \\h 6.4) message
could arrive when a completely different response is expected. 

\

### Retrieving settings

Before requesting streamed data, it may be necessary to ask QTM about
different settings, for example what frequency the system is capturing
in and what labels the labeled markers have. For all such information
that does not change with each frame, the command *GetParameters* is
used. QTM replies with an XML data string package, that the client
should parse and extract the required data from. See  REF \_Ref215376723
\\r \\h 5.5.

### Change settings

\

It is possible to change some of the QTM settings via the RT server.
This is done by sending an XML data packet, see  REF \_Ref215376723 \\r
\\h 5.5, containing the settings to be changed. Settings that are
possible to change are: *General*, *Image* and *Force*, See  REF
\_Ref267918861 \\r \\h 3.5.1,  REF \_Ref265068097 \\r \\h 3.5.2 and  REF
\_Ref267918891 \\r \\h 3.5.3.

\

If the settings were updated ok, the server will send a Setting
parameters succeeded command string response. Otherwise a &ldquo;Setting
parameters failed&rdquo; error string will be sent.

\

**Change settings is not available with the OSC protocol**.

#### General settings

**Frequency**

The Frequency setting tells QTM how long a capture started with the
*start* command shall be. The time is expressed in seconds.

**Capture\_Time**

The Capture\_Time setting tells QTM how long a capture started with the
*start* command shall be. The time is expressed in seconds.

**Start\_On\_External\_Trigger**

The Start\_On\_External\_Trigger setting tells QTM if the measurement
shall start on external trigger. The value can be true or false.

**External\_Time\_Base**

*Enabled*

Enable or disable external time base. Value can be True or False.

*Signal\_Source*

Signal source used for external time base. Selectable values:

Control port

IR receiver

SMPTE

Video sync

*Signal\_Mode*

Selectable values:

Periodic

Non-periodic

*Frequency\_Multiplier*

Multiply incoming frequency by this integer to get the camera frequency.
Can be combined with frequency divisor. Value is an integer.

*Frequency\_Divisor*

Divide incoming frequency by this integer to get the camera frequency.
Can be combined with frequency multiplier. Value is an integer.

*Frequency\_Tolerance*

Frequency tolerance in ppm of period time. Value is an integer. 

*Nominal\_Frequency*

Nominal frequency used by QTM. To disable nominal frequency set the
value to *None.* To enable nominal frequency set a float value.

*Signal\_Edge*

Control port TTL signal edge.

Negative

Positive

*Signal\_Shutter\_Delay*

Delay from signal to shutter opening in micro seconds. Value is an
integer.

*Non\_Periodic\_Timeout*

Max number of seconds expected between two frames in non-periodic mode.
Value is a float.

**Processing\_Actions**

*Tracking*

Enable or disable 3D or 2D tracking processing action. Value can be 3D,
2D or False.

*TwinSystemMerge*

Enable or disable twin system merge processing action. Value can be True
or False.

*SplineFill*

Enable or disable spline fill processing action. Value can be True or
False.

*AIM*

Enable or disable AIM processing action. Value can be True or False.

*Track6DOF*

Enable or disable 6DOF tracking processing action. Value can be True or
False.

*ForceData*

Enable or disable force data processing action. Value can be True or
False.

*GazeVectorData*

Enable or disable gaze vector data processing action. Value can be True
or False.

*ExportTSV*

Enable or disable export to TSV processing action. Value can be True or
False.

*ExportC3D*

Enable or disable export to C3D processing action. Value can be True or
False.

*ExportDiff*

Enable or disable export to Diff format processing action. Value can be
True or False.

*ExportMatlabDirect*

Enable or disable export to Matlab directly processing action. Value can
be True or False.

*ExportMatlabFile*

Enable or disable export to MATLAB file processing action. Value can be
True or False.

**Camera**

General settings consist of none or several *Camera* elements, with
following content.

*ID*

Select camera to which the settings shall apply. If the camera id is set
to a negative value, settings will apply to all cameras. This value must
always be present.

*Mode*

Changes camera mode for selected camera. Available camera modes are:

Marker

Marker Intensity

Video

*Video\_Exposure*

Set video exposure time for the camera selected by Camera ID, see above.
The value is either in micro seconds ( \> 5 µs) or in percent of max
value (0.0 to 1.0), 32-bit float.

*Video\_Flash\_Time*

Set video flash time for the camera selected by Camera ID, see above.
The value is either in micro seconds ( \> 5 µs) or in percent of max
value (0.0 to 1.0), 32-bit float.

*Marker\_Exposure*

Set marker exposure time for the camera selected by Camera ID, see
above. The value is either in micro seconds ( \> 5 µs) or in percent of
max value (0.0 to 1.0), 32-bit float.

*Marker\_Threshold*

Set marker threshold for the camera selected by Camera ID, see above.
The value is either an absolute value (50 – 900) or in percent of max
value (0.0 to 1.0), 32-bit float.

*Orientation*

Set camera orientation for the camera selected by Camera ID, see above.
The setting affects the 2D camera view in QTM. The value is in degrees
(0, 90, 180 or 270), 32-bit integer.

*Sync\_Out*

Camera settings consist of none or one *Sync\_Out * block, with
following content:

*Mode*

Synchronization mode for the selected camera. Available modes:

Shutter out

Multiplier

Divisor

Camera independent

Measurement time

Continuous 100Hz

SRAM wired

*Value*

This integer value is only used for three of the sync out modes. The
content is different depending on the *Mode* setting.

Multiplier Multiplier applied to the camera frequency

Divisor Divisor applied to the camera frequency

Camera independent Camera independent frequency

*Duty\_Cycle*

Output duty cycle in per cent (float). Only used in multiplier, divisor
and camera independent mode.

*Signal\_Polarity*

TTL signal polarity. Possible values:

Positive

Negative

\

#### Image settings

The *Image* element in the XML data packet consists of none or several
*Camera* elements. The image settings are used to request streaming
images from one or several cameras.

**Camera**

The settings within a *Camera* element must come in a predefined order,
see below and example  REF \_Ref268089790 \\r \\h 3.5.4. All settings
can be set individually, except for ID, which always has to be present.
If the selected camera is not enabled since before, the default values
will be used for all image settings that are not present in the
*Camera*element. Otherwise current image settings will be used.

*ID*

Select camera to fetch images from. This value must always be present in
the image settings.

*Enabled*

Enable or disable transmission of image data from camera selected by
Camera ID, see above.

True or False

*Format*

Available image formats.

RAWGrayscale

RAWBGR

JPG (Default)

PNG

*Width*

Width of the requested image. This does not take into account the
cropping. The width is the dimensions had the image not been cropped at
all. 32-bit integer.

*Height*

Height of the requested image. This does not take into account the
cropping. The height is the dimensions had the image not been cropped at
all. 32-bit integer.

*Left\_Crop*

Position of the requested image left edge relative the original image.
32-bit float.

0.0 = Original image left edge (Default).

1.0 = Original image right edge.

*Top\_Crop*

Position of requested image top edge relative the original image. 32-bit
float.

0.0 = Original image top edge (Default).

1.0 = Original image bottom edge.

*Right\_Crop*

Position of requested image right edge relative the original image.
32-bit float.

0.0 = Original image left edge.

1.0 = Original image right edge (Default).

*Bottom\_Crop*

Position of requested image bottom edge relative the original image.
32-bit float.

0.0 = Original image top edge.

1.0 = Original image bottom edge (Default).

\

#### Force settings

The Force section in the XML data packet consists of none or several
*Plate* elements. 

**Plate**

Each *Plate* element consists of a *Force\_Plate\_Index* and a
*Location* element. The settings within a plate element must come in a
predefined order, see example  REF \_Ref268089790 \\r \\h 3.5.4.

*Force\_ID*

ID of camera to fetch images from. This value must always be present in
the image settings.

*Location*

The *Location* element consists of four corner elements: *Corner1,
Corner2, Corner3* and *Corner4*. Each corner element consists of X, Y
and Z elements with the coordinates for the force plate (32 bit floats).

\
#### Settings example

Send the following XML data packet to the RT server:

\

\<QTM\_Settings\>

    \<General\>

        \<Capture\_Time\>2.5\</Capture\_Time\>

        \<Capture\_Frequency\>25\</Capture\_Frequency\>

       
\<Start\_On\_External\_Trigger\>True\</Start\_On\_External\_Trigger\>

        \<External\_Time\_Base\>

            \<Enabled\>True\</Enabled\>

            \<Signal\_Source\>Control port\</Signal\_Source\>

            \<Signal\_Mode\>Periodic\</Signal\_Mode\>

            \<Frequency\_Multiplier\>1\</Frequency\_Multiplier\>

            \<Frequency\_Divisor\>1\</Frequency\_Divisor\>

            \<Frequency\_Tolerance\>1000\</Frequency\_Tolerance\>

            \<Nominal\_Frequency\>None\</Nominal\_Frequency\>

            \<Signal\_Edge\>Negative\</Signal\_Edge\>

            \<Signal\_Shutter\_Delay\>10000\</Signal\_Shutter\_Delay\>

            \<Non\_Periodic\_Timeout\>10\</Non\_Periodic\_Timeout\>

        \</External\_Time\_Base\>

        \<Processing\_Actions\>

            \<Tracking\>3D\</Tracking\>

            \<TwinSystemMerge\>False\</TwinSystemMerge\>

            \<SplineFill\>True\</SplineFill\>

            \<AIM\>True\</AIM\>

            \<Track6DOF\>False\</Track6DOF\>

            \<ForceData\>False\</ForceData\>

            \<GazeVectorData\>False\</GazeVectorData\>

            \<ExportTSV\>False\</ExportTSV\>

            \<ExportC3D\>False\</ExportC3D\>

            \<ExportDiff\>False\</ExportDiff\>

            \<ExportMatlabDirect\>False\</ExportMatlabDirect\>

            \<ExportMatlabFile\>False\</ExportMatlabFile\>

        \</Processing\_Actions\>

        \<Camera\>

            \<ID\>1\</ID\>

            \<Mode\>Marker\</Mode\>

            \<Video\_Exposure\>0.5\</Video\_Exposure\>

            \<Video\_Flash\_Time\>0.3\</Video\_Flash\_Time\>

            \<Marker\_Exposure\>0.5\</Marker\_Exposure\>

            \<Marker\_Threshold\>0.4\</Marker\_Threshold\>

            \<Orientation\>0\</Orientation\>

            \<Sync\_Out\>

                \<Mode\>Camera independent\</Mode\>

                \<Value\>120\</Value\>

                \<Duty cycle\>50.000\</Duty cycle\>

                \<Signal\_Polarity\>Negative\</Signal\_Polarity\>

            \</Sync\_Out\>

        \</Camera\>

    \</General\>

    \<The\_3D\>

        \<TwinCalibrated\>False\</TwinCalibrated\>

    \</The\_3D\>

    \<Image\>

        \<Camera\>

            \<ID\>1\</ID\>

            \<Enabled\>True\</Enabled\>

            \<Format\>JPG\</Format\>

            \<Width\>640\</Width\>

            \<Height\>400\</Height\>

            \<Left\_Crop\>0.0\</Left\_Crop\>

            \<Top\_Crop\>0.0\</Top\_Crop\>

            \<Right\_Crop\>1.0\</Right\_Crop\>

            \<Bottom\_Crop\>1.0\</Bottom\_Crop\>

        \</Camera\>

    \</Image\>

    \<Force\>

        \<Plate\>

            \<Force\_ID\>1\</Force\_ID\>

            \<Location\>

                \<Corner1\>

                    \<X\>1000.00\</X\>

                    \<Y\>0.00\</Y\>

                    \<Z\>0.00\</Z\>

                \<Corner1\>

                \<Corner2\>

                    \<X\>1600.00\</X\>

                    \<Y\>0.00\</Y\>

                    \<Z\>0.00\</Z\>

                \<Corner2\>

                \<Corner3\>

                    \<X\>1600.00\</X\>

                    \<Y\>400.00\</Y\>

                    \<Z\>0.00\</Z\>

                \<Corner3\>

                \<Corner4\>

                    \<X\>1000.00\</X\>

                    \<Y\>400.00\</Y\>

                    \<Z\>0.00\</Z\>

                \<Corner4\>

            \</Location\>

        \</Plate\>

    \</Force\>

\</QTM\_Settings\>

\

Response: *Setting parameters succeeded    *or

*Setting parameters failed*

\

### Streaming data

The client has two options when requesting data frames from the QTM RT
server: polling mode or streaming mode. 

\

In polling mode, the client requests each frame in the pace it needs
them, using the command *GetCurrentFrame*. 

\

In streaming mode, the client tells QTM to stream data at a fixed rate
to the client by using the *StreamFrames* command. QTM keeps streaming
data until the measurement is stopped in QTM or the client tells QTM to
stop. 

\

In either mode, the client decides what type of data it needs (2D, 3D,
6D, Analog, Force or a combination of these). 

\

In streaming mode, the client may request streaming over UDP/IP instead
of TCP/IP, to minimize the protocol latency (at the cost of possibly
losing some data frames). When using the OSC protocol, all data is sent
via UDP. 


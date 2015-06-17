```xml
<QTM_Parameters_Ver_1.12>
    <General>
        <Frequency>240</Frequency>
        <Capture_Time>2.5</Capture_Time>
        <Start_On_External_Trigger>True</Start_On_External_Trigger>
        <External_Time_Base>
            <Enabled>True</Enabled>
            <Signal_Source>Control_Port</Signal_Source>
            <Signal_Mode>Periodic</Signal_Mode>
            <Frequency_Multiplier>1</Frequency_Multiplier>
            <Frequency_Divisor>1</Frequency_Divisor>
            <Frequency_Tolerance>1000</Frequency_Tolerance>
            <Nominal_Frequency>None</Nominal_Frequency>
            <Signal_Edge>Negative</Signal_Edge>
            <Signal_Shutter_Delay>10000</Signal_Shutter_Delay>
            <Non_Periodic_Timeout>10</Non_Periodic_Timeout>
        </External_Time_Base>
        <Processing_Actions>
            <Tracking>3D</Tracking>
            <TwinSystemMerge>False</TwinSystemMerge>
            <SplineFill>True</SplineFill>
            <AIM>True</AIM>
            <Track6DOF>False</Track6DOF>
            <ForceData>False</ForceData>
            <ExportTSV>False</ExportTSV>
            <ExportC3D>False</ExportC3D>
            <ExportDiff>False</ExportDiff>
            <ExportMatlabDirect>False</ExportMatlabDirect>
            <ExportMatlabFile>False</ExportMatlabFile>
        </Processing_Actions>
        <Camera>
            <ID>1</ID>
            <Model>Oqus 300</Model>
            <Underwater>False</Underwater>
            <Serial>7658787</Serial>
            <Mode>Marker</Mode>
            <Video_Exposure>
                <Current>10000</Current>
                <Min>5</Min>
                <Max>39980</Max>
            </Video_Exposure>
            <Video_Flash_Time>
                <Current>1000</Current>
                <Min>5</Min>
                <Max>2000</Max>
            </Video_Flash_Time>
            <Marker_Exposure>
                <Current>1000</Current>
                <Min>5</Min>
                <Max>2000</Max>
            </Marker_Exposure>
            <Marker_Threshold>
                <Current>200</Current>
                <Min>50</Min>
                <Max>900</Max>
            </Marker_Threshold>
            <Position>
                <X>100.0>/X>
                <Y>200.0>/Y>
                <Z>100.0>/Z>
                <Rot_1_1>0.0</Rot_1_1>
                <Rot_2_1>0.0</Rot_2_1>
                <Rot_3_1>0.0</Rot_3_1>
                <Rot_1_2>0.0</Rot_1_2>
                <Rot_2_2>0.0</Rot_2_2>
                <Rot_3_2>0.0</Rot_3_2>
                <Rot_1_3>0.0</Rot_1_3>
                <Rot_2_3>0.0</Rot_2_3>
                <Rot_3_3>0.0</Rot_3_3>
            </Position>
            <Orientation>0</Orientation>
            <Marker_Res>
                <Width>81920</Width>
                <Height>65536</Height>
            </Marker_Res>
            <Video_Res>
                <Width>1280</Width>
                <Height>1024</Height>
            </Video_Res>
            <Marker_FOV>
                         <Left>0</Left>
                         <Top>0</Top>
                         <Right>1279</Right>
                         <Bottom>1023</Bottom>
            </Marker_FOV>
            <Video_FOV>
                         <Left>0</Left>
                         <Top>0</Top>
                         <Right>1279</Right>
                         <Bottom>1023</Bottom>
            </Video_FOV>
            <Sync_Out>
                <Mode>Camera independent</Mode>
                <Value>120</Value>
                <Duty cycle>50.000</Duty cycle>
                <Signal_Polarity>Negative</Signal_Polarity>
            </Sync_Out>
        </Camera>
    </General>
</QTM_Parameters_Ver_1.12>   
```
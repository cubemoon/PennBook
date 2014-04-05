package edu.upenn.team19;
import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Mapper.Context;

public class InitMapper extends Mapper<LongWritable, Text, Text, Text>{
	
	public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException{
		String[] content = value.toString().split("\t");
		String thisuser = content[0];
		String otheruser = content[1].split(";")[0];
		String state = content[1].split(";")[1];
		
		System.out.println("user: " + thisuser + " and " + otheruser + "with state: " + state);
		
		if (state.equals("affiliation")) {
			// Haven't dealt with one side edge (reversing). 
			context.write(new Text(thisuser), new Text(otheruser + ":" + 2));
		} else if (state.equals("friend")){
			context.write(new Text(thisuser), new Text(otheruser + ":" + 1));
		} else if (state.equals("pending")) {
			context.write(new Text(otheruser), new Text(thisuser + ":" + 1));
		}
	}
}
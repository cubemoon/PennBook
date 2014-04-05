package edu.upenn.team19;
import java.io.IOException;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.Reducer.Context;

public class Diff2Reducer extends Reducer<Text, Text, Text, Text>{
	public void reduce(Text key, Iterable<Text> values, Context context) throws IOException, InterruptedException{
		Double maxdiff = Double.MIN_VALUE;
		
		for (Text value : values) {
			Double diff = Double.parseDouble(value.toString());
			if (diff > maxdiff){
				maxdiff = diff;
			}
		}
		
		context.write(new Text(maxdiff.toString()), new Text());
	}
}